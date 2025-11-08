// types/learning.ts
// 증분 학습 시스템 타입 정의

/**
 * 파싱 결과 인터페이스
 */
export interface ParsingResult {
  insuCd: string;
  productName?: string;
  insuTerm: string;
  payTerm: string;
  ageRange: string;
  renew: string;
  specialNotes?: string;
  validationSource?: string;
}

/**
 * 수정 요청 인터페이스
 */
export interface CorrectionRequest {
  insuCd: string;
  originalResult: ParsingResult;
  correctedResult: ParsingResult;
  pdfText: string;
  correctionReason?: string;
}

/**
 * 학습 통계 인터페이스
 */
export interface LearningStatistics {
  totalCorrections: number;
  totalPatterns: number;
  totalFewShotExamples: number;
  currentAccuracy: number;
  improvement: number;
}

/**
 * 수정 응답 인터페이스
 */
export interface CorrectionResponse {
  success: boolean;
  message: string;
  statistics?: LearningStatistics;
}

/**
 * API 응답 래퍼
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
















