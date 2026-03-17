
// 이 파일은 화면에서 쓰이는 데이터의 '모양'을 정의합니다.
// 쉬운 예: '모니터 한 종류가 몇 대 있는지'를 담은 상자 모양을 정해두는 거예요.

export enum MonitorGrade {
  GOOD = '양품',   // 상태가 좋은 모니터
  BAD = '불량'    // 고장/파손 등 문제가 있는 모니터
}

export enum PowerType {
  POWER = '파워모델',    // 일반 파워케이블을 쓰는 모델
  ADAPTER = '어댑터모델' // 어댑터가 필요한 모델
}

export interface MonitorItem {
  id: string;             // 화면에서 구분하기 위한 고유번호
  grade: MonitorGrade;    // 양품/불량
  brand: string;          // 브랜드 이름
  inch: string;           // 화면 크기(인치)
  powerType: PowerType;   // 전원 방식(파워/어댑터)
  quantity: number;       // 같은 사양이 몇 대인지
}

export interface Pallet {
  id: string;           // 팔레트 번호 예) P-20260101-001
  department: string;   // 해당 자산의 본부
  location: string;     // 창고에서의 위치(최대 6글자)
  lastUpdated: string;  // 마지막 수정 시간(문장 형태)
  memo: string;         // 메모
  items: MonitorItem[]; // 이 팔레트에 담긴 모니터 목록
}

export interface FilterOptions {
  department: string; // 본부 필터
  grade: string;      // 상태 필터
  brand: string;      // 브랜드 필터
  inch: string;       // 인치 필터
  powerType: string;  // 전원 방식 필터
}
