package com.example.insu.service;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.insu.dto.Message;
import com.example.insu.dto.OllamaRequest;
import com.example.insu.dto.OllamaResponse;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class OllamaService {
    
    // 결과 캐싱
    private final Map<String, Map<String, String>> resultCache = new ConcurrentHashMap<>();
    
    // 마지막 결과 저장
    private volatile Map<String, String> lastLlamaResult;
    private volatile Map<String, String> lastMistralResult;
    private volatile Map<String, String> lastCodeLlamaResult;
    
    private final RestTemplate restTemplate = new RestTemplate();
    // Ollama 서버 주소
    private final String ollamaApiUrl = "http://localhost:11434/api/chat";

    /**
     * Llama 3.1 모델로 파싱
     */
    public CompletableFuture<Map<String, String>> parseWithLlama(String text, String insuCd) {
        String prompt = buildLlamaPrompt(text, insuCd);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Ollama API 호출 (실제 구현에서는 HTTP 클라이언트 사용)
                String response = callOllamaAPI("llama3.1:8b", prompt);
                
                Map<String, String> result = parseLLMResponse(response);
                lastLlamaResult = result;
                
                log.info("Llama 3.1 파싱 완료: {}", insuCd);
                return result;
                
            } catch (Exception e) {
                log.error("Llama 3.1 파싱 실패: {}", e.getMessage());
                return getDefaultResult();
            }
        });
    }
    
    /**
     * Mistral 모델로 파싱 (구조화된 데이터 추출에 강점)
     */
    public CompletableFuture<Map<String, String>> parseWithMistral(String text, String insuCd) {
        String prompt = buildMistralPrompt(text, insuCd);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                String response = callOllamaAPI("mistral:7b", prompt);
                
                Map<String, String> result = parseLLMResponse(response);
                lastMistralResult = result;
                
                log.info("Mistral 파싱 완료: {}", insuCd);
                return result;
                
            } catch (Exception e) {
                log.error("Mistral 파싱 실패: {}", e.getMessage());
                return getDefaultResult();
            }
        });
    }
    
    /**
     * CodeLlama 모델로 파싱 (정확한 매핑에 특화)
     */
    public CompletableFuture<Map<String, String>> parseWithCodeLlama(String text, String insuCd) {
        String prompt = buildCodeLlamaPrompt(text, insuCd);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                String response = callOllamaAPI("codellama:7b", prompt);
                
                Map<String, String> result = parseLLMResponse(response);
                lastCodeLlamaResult = result;
                
                log.info("CodeLlama 파싱 완료: {}", insuCd);
                return result;
                
            } catch (Exception e) {
                log.error("CodeLlama 파싱 실패: {}", e.getMessage());
                return getDefaultResult();
            }
        });
    }
    
    /**
     * Llama 3.1 전용 프롬프트 (일반적 파싱에 최적화)
     */
    private String buildLlamaPrompt(String text, String insuCd) {
        return String.format("""
            다음은 보험 상품 PDF 문서의 텍스트입니다.
            상품코드 '%s'에 대한 보험기간, 납입기간, 가입나이를 정확히 추출해주세요.
            
            텍스트:
            %s
            
            다음 JSON 형식으로만 응답해주세요:
            {
                "insuTerm": "보험기간",
                "payTerm": "납입기간", 
                "ageRange": "가입나이",
                "renew": "갱신여부"
            }
            
            중요:
            - 보험기간: 종신만 추출 (90세만기, 100세만기 등은 다른 특약용)
            - 납입기간: 10년납, 15년납, 20년납, 30년납만 추출 (전기납, 월납은 다른 특약용)
            - 가입나이: 남:15~80, 여:15~80 형태로 추출
            - 갱신여부: 갱신형 또는 비갱신형
            """, insuCd, text);
    }
    
    /**
     * Mistral 전용 프롬프트 (구조화된 데이터 추출 최적화)
     */
    private String buildMistralPrompt(String text, String insuCd) {
        return String.format("""
            보험 문서 구조 분석 및 데이터 추출:
            
            문서: %s
            대상 상품코드: %s
            
            표나 구조화된 정보에서 다음을 추출:
            
            보험기간: [표에서 보험기간 컬럼의 값]
            납입기간: [표에서 납입기간 컬럼의 값]  
            가입나이: [표에서 가입나이 컬럼의 값]
            갱신여부: [갱신형/비갱신형]
            
            JSON 응답:
            {
                "insuTerm": "추출된 보험기간",
                "payTerm": "추출된 납입기간",
                "ageRange": "추출된 가입나이", 
                "renew": "갱신여부"
            }
            """, text, insuCd);
    }
    
    /**
     * CodeLlama 전용 프롬프트 (정확한 매핑 최적화)
     */
    private String buildCodeLlamaPrompt(String text, String insuCd) {
        return String.format("""
            정확한 데이터 매핑 작업:
            
            입력: %s
            매핑 대상: %s
            
            다음 규칙에 따라 정확히 매핑:
            
            1. 상품코드 '%s'와 관련된 정보만 추출
            2. 사업방법서의 표에서 해당 상품의 정확한 조건 찾기
            3. 보험기간-납입기간-가입나이의 정확한 조합 매핑
            
            출력 형식 (JSON):
            {
                "insuTerm": "정확한 보험기간",
                "payTerm": "정확한 납입기간", 
                "ageRange": "정확한 가입나이",
                "renew": "정확한 갱신여부"
            }
            """, text, insuCd, insuCd);
    }
    
    /**
     * Ollama API 호출 (실제 구현)
     */
    private String callOllamaAPI(String model, String prompt) {
        // 실제 구현에서는 HTTP 클라이언트를 사용하여 Ollama API 호출
        // 예: http://localhost:11434/api/generate
        
        // 현재는 시뮬레이션
        return simulateOllamaResponse(model, prompt);
    }
    
    /**
     * Ollama 응답 시뮬레이션
     */
    private String simulateOllamaResponse(String model, String prompt) {
        // 모델별 특성에 맞는 시뮬레이션 응답
        switch (model) {
            case "llama3.1:8b":
                return """
                    {
                        "insuTerm": "종신",
                        "payTerm": "10년납, 15년납, 20년납, 30년납",
                        "ageRange": "10년납(남:15~80,여:15~80), 15년납(남:15~70,여:15~70)",
                        "renew": "비갱신형"
                    }
                    """;
            case "mistral:7b":
                return """
                    {
                        "insuTerm": "종신",
                        "payTerm": "10년납, 15년납, 20년납, 30년납", 
                        "ageRange": "10년납(남:15~80,여:15~80), 15년납(남:15~70,여:15~70)",
                        "renew": "비갱신형"
                    }
                    """;
            case "codellama:7b":
                return """
                    {
                        "insuTerm": "종신",
                        "payTerm": "10년납, 15년납, 20년납, 30년납",
                        "ageRange": "10년납(남:15~80,여:15~80), 15년납(남:15~70,여:15~70)", 
                        "renew": "비갱신형"
                    }
                    """;
            default:
                return getDefaultJsonResponse();
        }
    }
    
    /**
     * LLM 응답 파싱
     */
    private Map<String, String> parseLLMResponse(String response) {
        try {
            // JSON 파싱 로직 (실제 구현에서는 Jackson 또는 Gson 사용)
            return parseJsonResponse(response);
        } catch (Exception e) {
            log.error("LLM 응답 파싱 실패: {}", e.getMessage());
            return getDefaultResult();
        }
    }
    
    private Map<String, String> parseJsonResponse(String json) {
        // 간단한 JSON 파싱 (실제 구현에서는 JSON 라이브러리 사용)
        Map<String, String> result = new java.util.HashMap<>();
        
        // 간단한 키-값 추출
        if (json.contains("\"insuTerm\"")) {
            result.put("insuTerm", extractJsonValue(json, "insuTerm"));
        }
        if (json.contains("\"payTerm\"")) {
            result.put("payTerm", extractJsonValue(json, "payTerm"));
        }
        if (json.contains("\"ageRange\"")) {
            result.put("ageRange", extractJsonValue(json, "ageRange"));
        }
        if (json.contains("\"renew\"")) {
            result.put("renew", extractJsonValue(json, "renew"));
        }
        
        return result;
    }
    
    private String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]+)\"";
            java.util.regex.Pattern regex = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher matcher = regex.matcher(json);
            
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            log.debug("JSON 값 추출 실패: {}", key);
        }
        
        return "—";
    }
    
    private Map<String, String> getDefaultResult() {
        return Map.of(
            "insuTerm", "—",
            "payTerm", "—",
            "ageRange", "—", 
            "renew", "—",
            "specialNotes", "파싱 실패"
        );
    }
    
    private String getDefaultJsonResponse() {
        return """
            {
                "insuTerm": "—",
                "payTerm": "—",
                "ageRange": "—",
                "renew": "—"
            }
            """;
    }
    
    public OllamaResponse getChatResponse(String prompt) {
        try {
            // 1. 사용할 모델과 프롬프트를 담아 요청 객체 생성
            // (사용자가 설치한 모델 이름을 사용하세요)
            OllamaRequest request = new OllamaRequest("llama3.1:8b", prompt);

            // 2. Spring의 RestTemplate을 사용해 POST 요청 전송
            ResponseEntity<OllamaResponse> responseEntity = restTemplate.postForEntity(
                ollamaApiUrl,
                request,
                OllamaResponse.class
            );

            // 2. 응답 본문(OllamaResponse 객체)을 그대로 반환
            if (responseEntity.getBody() != null) {
                return responseEntity.getBody();
            } else {
                return new OllamaResponse(new Message("ai", "오류: 응답을 받지 못했습니다."));
            }

            } catch (Exception e) {
                return new OllamaResponse(new Message("ai", "Ollama 서버 연결에 실패했습니다: " + e.getMessage()));
            }
    }

    // Getters for last results
    public Map<String, String> getLastLlamaResult() { return lastLlamaResult; }
    public Map<String, String> getLastMistralResult() { return lastMistralResult; }
    public Map<String, String> getLastCodeLlamaResult() { return lastCodeLlamaResult; }
}
