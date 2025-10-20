// api/learningApi.ts
// 증분 학습 API 클라이언트

import { CorrectionRequest, CorrectionResponse, LearningStatistics } from '../types/learning';

const API_BASE_URL = 'http://localhost:8081/api/learning';

/**
 * 수정사항 제출
 */
export async function submitCorrection(
  request: CorrectionRequest
): Promise<CorrectionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/correction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('수정사항 제출 오류:', error);
    throw error;
  }
}

/**
 * 학습 통계 조회
 */
export async function fetchStatistics(): Promise<LearningStatistics> {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('통계 조회 오류:', error);
    throw error;
  }
}

/**
 * 학습 데이터 초기화
 */
export async function resetLearning(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('학습 데이터 초기화 오류:', error);
    throw error;
  }
}

/**
 * PDF 파일 업로드
 */
export async function uploadPdfFile(file: File): Promise<{ success: boolean; message: string; fileName?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8081/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PDF 파일 업로드 오류:', error);
    throw error;
  }
}

/**
 * Few-Shot 예시 수동 생성
 */
export async function createFewShotExample(data: {
  insuCd: string;
  productName: string;
  inputText: string;
  outputInsuTerm: string;
  outputPayTerm: string;
  outputAgeRange: string;
  outputRenew: string;
}): Promise<any> {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/few-shot/generate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Few-Shot 예시 생성 성공 시 이벤트 발생
    if (result.success) {
      window.dispatchEvent(new CustomEvent('fewShotGenerated', { 
        detail: { insuCd: data.insuCd } 
      }));
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    }
    
    return result;
  } catch (error) {
    console.error('Few-Shot 예시 생성 오류:', error);
    throw error;
  }
}

/**
 * Few-Shot 예시 일괄 생성
 */
export async function generateBatchFewShotExamples(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/few-shot/generate-batch`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Few-Shot 예시 생성 성공 시 이벤트 발생
    if (result.success) {
      window.dispatchEvent(new CustomEvent('fewShotGenerated', { 
        detail: { generatedCount: result.generatedCount } 
      }));
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    }
    
    return result;
  } catch (error) {
    console.error('Few-Shot 예시 일괄 생성 오류:', error);
    throw error;
  }
}

/**
 * 수정 건수 상세 정보 조회
 */
export async function fetchRevisionDetails(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/revisions/detail`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('수정 건수 상세 조회 오류:', error);
    throw error;
  }
}

/**
 * 학습된 패턴 상세 정보 조회
 */
export async function fetchPatternDetails(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/patterns/detail`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('학습된 패턴 상세 조회 오류:', error);
    throw error;
  }
}

/**
 * Few-Shot 예시 상세 정보 조회
 */
export async function fetchExampleDetails(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/examples/detail`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Few-Shot 예시 상세 조회 오류:', error);
    throw error;
  }
}

/**
 * 정확도 상세 정보 조회
 */
export async function fetchAccuracyDetails(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/accuracy/detail`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('정확도 상세 조회 오류:', error);
    throw error;
  }
}

/**
 * 정확도 향상 상세 정보 조회
 */
export async function fetchImprovementDetails(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/improvement/detail`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('정확도 향상 상세 조회 오류:', error);
    throw error;
  }
}

