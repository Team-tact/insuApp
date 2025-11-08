// src/renderer/src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8082";

export async function httpGet<T>(url: string, timeoutMs: number = 30000): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
  const startTime = performance.now();
  console.log(`[HTTP] GET 요청 시작: ${fullUrl} (타임아웃: ${timeoutMs}ms)`);
  
  try {
    // AbortController를 사용한 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      const elapsed = performance.now() - startTime;
      console.warn(`[HTTP] 요청 타임아웃: ${fullUrl} (경과시간: ${elapsed.toFixed(2)}ms)`);
      controller.abort();
    }, timeoutMs);
    
    const requestStartTime = performance.now();
    const r = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
    const requestEndTime = performance.now();
    const requestDuration = requestEndTime - requestStartTime;
    
    // 타임아웃이 발생하지 않았다면 타이머 정리
    clearTimeout(timeoutId);
    
    console.log(`[HTTP] 응답 상태: ${r.status} ${r.statusText} (요청시간: ${requestDuration.toFixed(2)}ms)`);
    
    if (!r.ok) {
      const errorText = await r.text();
      const totalTime = performance.now() - startTime;
      console.error(`[HTTP] 오류 응답 내용:`, errorText);
      console.error(`[HTTP] 오류 발생까지 총 시간: ${totalTime.toFixed(2)}ms`);
      throw new Error(`HTTP ${r.status} ${r.statusText}: ${errorText}`);
    }
    
    // 인코딩 문제 해결을 위한 텍스트 디코딩
    const parseStartTime = performance.now();
    const text = await r.text();
    const parseEndTime = performance.now();
    const parseDuration = parseEndTime - parseStartTime;
    
    console.log(`[HTTP] 응답 텍스트 길이: ${text.length} 문자 (파싱시간: ${parseDuration.toFixed(2)}ms)`);
    
    try {
      const jsonStartTime = performance.now();
      const result = JSON.parse(text);
      const jsonEndTime = performance.now();
      const jsonDuration = jsonEndTime - jsonStartTime;
      const totalTime = performance.now() - startTime;
      
      console.log(`[HTTP] JSON 파싱 성공 (JSON파싱시간: ${jsonDuration.toFixed(2)}ms, 총시간: ${totalTime.toFixed(2)}ms)`);
      
      // 성능 분석을 위한 상세 로그
      if (totalTime > 1000) {
        console.warn(`[PERF] 느린 API 호출 감지: ${fullUrl} - 총시간: ${totalTime.toFixed(2)}ms`);
        console.warn(`[PERF] 세부 시간 - 요청: ${requestDuration.toFixed(2)}ms, 파싱: ${parseDuration.toFixed(2)}ms, JSON: ${jsonDuration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (e) {
      const totalTime = performance.now() - startTime;
      console.error('[HTTP] JSON 파싱 오류:', e);
      console.error('[HTTP] 응답 텍스트:', text);
      console.error(`[HTTP] JSON 파싱 실패까지 총 시간: ${totalTime.toFixed(2)}ms`);
      throw new Error(`JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (e) {
    console.error(`[HTTP] 요청 실패:`, e);
    
    // 타임아웃 오류 처리
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`요청 타임아웃: ${timeoutMs}ms 내에 응답을 받지 못했습니다. (${fullUrl})`);
    }
    
    // 네트워크 오류 처리
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error(`네트워크 오류: 백엔드 서버에 연결할 수 없습니다. (${fullUrl})`);
    }
    
    throw e;
  }
}

export async function httpPost<T>(url: string, body: any, timeoutMs: number = 30000): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
  console.log(`[HTTP] POST 요청: ${fullUrl} (타임아웃: ${timeoutMs}ms)`);
  
  try {
    // AbortController를 사용한 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[HTTP] POST 요청 타임아웃: ${fullUrl}`);
      controller.abort();
    }, timeoutMs);
    
    const r = await fetch(fullUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { 
        "Content-Type": "application/json; charset=utf-8",
        'Accept': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body),
    });
    
    // 타임아웃이 발생하지 않았다면 타이머 정리
    clearTimeout(timeoutId);
    
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    
    // 인코딩 문제 해결을 위한 텍스트 디코딩
    const text = await r.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON 파싱 오류:', e);
      console.error('응답 텍스트:', text);
      throw new Error('JSON 파싱 실패');
    }
  } catch (e) {
    // 타임아웃 오류 처리
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`POST 요청 타임아웃: ${timeoutMs}ms 내에 응답을 받지 못했습니다. (${fullUrl})`);
    }
    throw e;
  }
}

// 파일 업로드를 위한 FormData POST 함수
export async function httpPostFile<T>(url: string, formData: FormData, timeoutMs: number = 60000): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
  console.log(`[HTTP] POST 파일 요청: ${fullUrl} (타임아웃: ${timeoutMs}ms)`);
  
  try {
    // AbortController를 사용한 타임아웃 설정 (파일 업로드는 더 긴 타임아웃)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[HTTP] 파일 업로드 요청 타임아웃: ${fullUrl}`);
      controller.abort();
    }, timeoutMs);
    
    const r = await fetch(fullUrl, {
      method: "POST",
      signal: controller.signal,
      body: formData, // Content-Type 헤더를 자동으로 설정 (multipart/form-data)
    });
    
    // 타임아웃이 발생하지 않았다면 타이머 정리
    clearTimeout(timeoutId);
    
    console.log(`[HTTP] 파일 업로드 응답 상태: ${r.status} ${r.statusText}`);
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error(`[HTTP] 파일 업로드 오류 응답 내용:`, errorText);
      throw new Error(`HTTP ${r.status} ${r.statusText}: ${errorText}`);
    }
    
    const text = await r.text();
    console.log(`[HTTP] 파일 업로드 응답 텍스트 길이: ${text.length} 문자`);
    
    try {
      const result = JSON.parse(text);
      console.log(`[HTTP] 파일 업로드 JSON 파싱 성공:`, result);
      return result;
    } catch (e) {
      console.error('[HTTP] 파일 업로드 JSON 파싱 오류:', e);
      console.error('[HTTP] 응답 텍스트:', text);
      throw new Error(`JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (e) {
    console.error(`[HTTP] 파일 업로드 요청 실패:`, e);
    
    // 타임아웃 오류 처리
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`파일 업로드 타임아웃: ${timeoutMs}ms 내에 응답을 받지 못했습니다. (${fullUrl})`);
    }
    
    // 네트워크 오류 처리
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error(`네트워크 오류: 백엔드 서버에 연결할 수 없습니다. (${fullUrl})`);
    }
    
    throw e;
  }
}
