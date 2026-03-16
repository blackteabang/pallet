
export enum MonitorGrade {
  GOOD = '양품',
  BAD = '불량'
}

export enum PowerType {
  POWER = '파워모델',
  ADAPTER = '어댑터모델'
}

export interface MonitorItem {
  id: string;
  grade: MonitorGrade;
  brand: string;
  inch: string;
  powerType: PowerType;
  quantity: number;
}

export interface Pallet {
  id: string; // P-YYYYMMDD-XXXX
  department: string;
  lastUpdated: string;
  memo: string;
  items: MonitorItem[];
}

export interface FilterOptions {
  department: string;
  grade: string;
  brand: string;
  inch: string;
  powerType: string;
}
