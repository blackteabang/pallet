
import { GoogleGenAI } from "@google/genai";
import { Pallet } from "./types";

export const getInventoryInsights = async (pallets: Pallet[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const inventoryData = pallets.map(p => ({
    id: p.id,
    dept: p.department,
    items: p.items.map(i => `${i.grade} ${i.brand} ${i.inch}인치 x${i.quantity}`)
  }));

  const prompt = `
    다음은 현재 물류 창고의 팔레트별 모니터 적재 현황입니다.
    ${JSON.stringify(inventoryData, null, 2)}
    
    이 데이터를 바탕으로 창고 관리자에게 다음 정보를 3줄 이내로 간략하게 한국어로 요약해 주세요:
    1. 현재 가장 많이 적재된 브랜드와 사양
    2. 저단 팔레트(수량이 적은 팔레트) 합치기 제안
    3. 전체적인 재고 상태 요약
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "재고 분석 정보를 가져오는 데 실패했습니다.";
  }
};
