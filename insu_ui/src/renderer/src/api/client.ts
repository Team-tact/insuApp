// src/renderer/src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8081";

export async function httpGet<T>(url: string): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
  console.log(`[HTTP] GET 요청: ${fullUrl}`);
  
  try {
    const r = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
    console.log(`[HTTP] 응답 상태: ${r.status} ${r.statusText}`);
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error(`[HTTP] 오류 응답 내용:`, errorText);
      throw new Error(`HTTP ${r.status} ${r.statusText}: ${errorText}`);
    }
    
    // 인코딩 문제 해결을 위한 텍스트 디코딩
    const text = await r.text();
    console.log(`[HTTP] 응답 텍스트 길이: ${text.length} 문자`);
    
    try {
      const result = JSON.parse(text);
      console.log(`[HTTP] JSON 파싱 성공:`, result);
      return result;
    } catch (e) {
      console.error('[HTTP] JSON 파싱 오류:', e);
      console.error('[HTTP] 응답 텍스트:', text);
      throw new Error(`JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (e) {
    console.error(`[HTTP] 요청 실패:`, e);
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error(`네트워크 오류: 백엔드 서버에 연결할 수 없습니다. (${fullUrl})`);
    }
    throw e;
  }
}

export async function httpPost<T>(url: string, body: any): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
  const r = await fetch(fullUrl, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json; charset=utf-8",
      'Accept': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(body),
  });
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
}

// 파일 업로드를 위한 FormData POST 함수
export async function httpPostFile<T>(url: string, formData: FormData): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
  console.log(`[HTTP] POST 파일 요청: ${fullUrl}`);
  
  try {
    const r = await fetch(fullUrl, {
      method: "POST",
      body: formData, // Content-Type 헤더를 자동으로 설정 (multipart/form-data)
    });
    
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
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error(`네트워크 오류: 백엔드 서버에 연결할 수 없습니다. (${fullUrl})`);
    }
    throw e;
  }
}
