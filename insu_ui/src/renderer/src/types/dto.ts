// src/renderer/src/types/dto.ts

export type Terms = {
  ageRange: string | null | undefined;
  insuTerm?: string | null;
  payTerm?: string | null;
  renew?: string | null;
  specialNotes?: string | null;
  age?: { common?: string | null; male?: string | null; female?: string | null } | null;
};

export type ProductInfo = {
  insuCd: string;
  name?: string | null;
  type?: "주계약" | "특약" | null;
  terms?: Terms | null;
  calcAvailable?: boolean | null;
  message?: string | null;
};


export type PremiumCalcRequest = {
  insuCd: string;
  gender: "M" | "F";
  age: number;
  insuTerm: number;
  payTerm?: number | null;
  jeongi?: boolean | null;
  amountManwon: number;
};

export type PremiumCalcResponse = {
  insuCd: string;
  gender: "M" | "F";
  age?: number | null;
  insuTerm?: number | null;
  payTerm?: number | null;
  amountManwon?: number | null;
  amountWon?: string | number | null;
  stdAmount?: string | number | null;
  rate?: string | number | null;
  premiumWon?: string | number | null;
  message?: string | null;
};

// 공통 DTO

export type PdfFile = { name: string; size?: number; mtime?: string };

export type CodeEntry = { insuCd: string; name: string; type?: string };

export type PolicyTerms = {
  ageRange?: string | null;   // "남/15~80 여/15~80" 또는 "15~80"
  insuTerm?: string | null;   // "종신" / "10년만기,20년만기(갱신)" 등
  payTerm?: string | null;    // "전기납, 10/15/20/30년납" 등
  renew?: string | null;      // "10년갱신/20년갱신" 등
  specialNotes?: string | null;
};

export type ProductInfoResponse = {
  insuCd: string;
  name: string | null;
  type: "주계약" | "특약" | string | null;
  terms: PolicyTerms | null;
  calcAvailable: boolean;
  discount: unknown | null;
  message: string | null;
  age?: number | null;
  insuTerm?: number | null;
  payTerm?: number | null;
};

export type LimitInfo = {
  insuCd: string;
  name: string | null;
  minWon: number | null;   // 원 단위
  maxWon: number | null;   // 원 단위
  display: string | null;  // "최소 100만 ~ 최대 1000만" 등
  message: string | null;
};

// 6번: 테이블 존재검사 결과(준비금키/준비금/보험료)
export type DataCheckItem = {
  table: "RVT_RSRV_KEY" | "RVT_RSRV_RATE" | "RVT_PREM_RATE";
  ok: boolean;
  // 누락 상세(“27세, 보험기간 20, 납입기간 10 없음” 같은 문구들)
  missing: string[];
};

export type DataCheckResponse = {
  insuCd: string;
  items: DataCheckItem[]; // 세 테이블 각각 1개
};

// 7번: 나이선택 기준 MIN/MAX(남/여)
export type MinMaxPremium = {
  manMin?: number | null;
  manMax?: number | null;
  fmlMin?: number | null;
  fmlMax?: number | null;
};

