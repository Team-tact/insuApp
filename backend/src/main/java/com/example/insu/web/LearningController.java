package com.example.insu.web;

import com.example.insu.dto.LearningStatistics;
import com.example.insu.mapper.CorrectionLogMapper;
import com.example.insu.service.IncrementalLearningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Phase 3: 점진적 학습 API 컨트롤러 (DB 연동 버전)
 */
@Slf4j
@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {
    
    private final IncrementalLearningService learningService;
    private final CorrectionLogMapper correctionLogMapper;
    
    /**
     * 사용자 수정사항 제출
     */
    @PostMapping("/correction")
    public Map<String, Object> submitCorrection(@RequestBody CorrectionRequest request) {
        log.info("=== 백엔드  API 요청 수신 ===");
        log.info("📥 요청 데이터: insuCd={}, productName={}", 
            request.getInsuCd(), 
            request.getOriginalResult().get("productName"));
        log.info("📥 원본 데이터: insuTerm={}, payTerm={}, ageRange={}, renew={}", 
            request.getOriginalResult().get("insuTerm"),
            request.getOriginalResult().get("payTerm"),
            request.getOriginalResult().get("ageRange"),
            request.getOriginalResult().get("renew"));
        log.info("📥 수정 데이터: insuTerm={}, payTerm={}, ageRange={}, renew={}", 
            request.getCorrectedResult().get("insuTerm"),
            request.getCorrectedResult().get("payTerm"),
            request.getCorrectedResult().get("ageRange"),
            request.getCorrectedResult().get("renew"));
        log.info("📥 수정 이유: {}", request.getCorrectionReason());
        log.info("📥 PDF 텍스트 길이: {}", request.getPdfText() != null ? request.getPdfText().length() : 0);
        
        try {
            log.info("🔄 학습 서비스 호출 시작");
            learningService.logCorrection(
                request.getInsuCd(),
                request.getOriginalResult(),
                request.getCorrectedResult(),
                request.getPdfText(),
                request.getCorrectionReason()
            );
            log.info("✅ 학습 서비스 호출 완료");
            
            log.info("📊 통계 조회 시작");
            LearningStatistics stats = learningService.getStatistics();
            log.info("📊 통계 조회 완료: corrections={}, patterns={}, fewShot={}, accuracy={}", 
                stats.getTotalCorrections(),
                stats.getTotalPatterns(),
                stats.getTotalFewShotExamples(),
                stats.getCurrentAccuracy());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "수정사항이 학습되었습니다");
            response.put("statistics", stats);
            
            log.info("=== 백엔드 API 응답 전송 ===");
            log.info("📤 응답 데이터: success=true, message={}", response.get("message"));
            log.info("📤 통계 데이터: {}", stats);
            
            return response;
            
        } catch (Exception e) {
            log.error("=== 백엔드 API 처리 오류 ===");
            log.error("❌ 오류 발생: {}", e.getMessage());
            log.error("❌ 오류 타입: {}", e.getClass().getSimpleName());
            log.error("❌ 오류 스택: ", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "오류: " + e.getMessage());
            
            log.info("📤 오류 응답 전송: success=false, message={}", response.get("message"));
            return response;
        }
    }
    
    /**
     * 학습 통계 조회
     */
    @GetMapping("/statistics")
    public Map<String, Object> getStatistics() {
        log.info("=== 통계 조회 API 요청 ===");
        
        log.info("🔄 통계 데이터 조회 시작");
        LearningStatistics stats = learningService.getStatistics();
        log.info("✅ 통계 데이터 조회 완료");
        
        log.info("📊 조회된 통계: corrections={}, patterns={}, fewShot={}, accuracy={}, improvement={}", 
            stats.getTotalCorrections(),
            stats.getTotalPatterns(),
            stats.getTotalFewShotExamples(),
            stats.getCurrentAccuracy(),
            stats.getImprovement());
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalCorrections", stats.getTotalCorrections());
        response.put("totalPatterns", stats.getTotalPatterns());
        response.put("totalFewShotExamples", stats.getTotalFewShotExamples());
        response.put("currentAccuracy", stats.getCurrentAccuracy());
        response.put("improvement", stats.getAccuracyImprovement());
        
        log.info("📤 통계 응답 전송: {}", response);
        return response;
    }
    
    /**
     * 학습 데이터 초기화
     */
    @PostMapping("/reset")
    public Map<String, Object> resetLearning() {
        log.warn("학습 데이터 초기화 요청");
        
        learningService.clearLearningData();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "학습 데이터가 초기화되었습니다");
        
        return response;
    }
    
    /**
     * 수정 건수 상세 정보 조회
     */
    @GetMapping("/revisions/detail")
    public Map<String, Object> getRevisionDetails() {
        log.info("수정 건수 상세 정보 조회 요청");
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalRevisions", learningService.getTotalCorrections());
        response.put("lastRevision", learningService.getLastRevisionDate());
        response.put("revisionFrequency", "일일 평균 0.5건");
        response.put("recentRevisions", learningService.getRecentRevisions());
        
        return response;
    }
    
    /**
     * 학습된 패턴 상세 정보 조회
     */
    @GetMapping("/patterns/detail")
    public Map<String, Object> getPatternDetails() {
        log.info("학습된 패턴 상세 정보 조회 요청");
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalPatterns", learningService.getTotalPatterns());
        response.put("activePatterns", learningService.getActivePatterns());
        response.put("newPatterns", learningService.getNewPatterns());
        response.put("patterns", learningService.getPatternDetails());
        
        return response;
    }
    
    /**
     * Few-Shot 예시 상세 정보 조회
     */
    @GetMapping("/examples/detail")
    public Map<String, Object> getExampleDetails() {
        log.info("Few-Shot 예시 상세 정보 조회 요청");
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalExamples", learningService.getTotalFewShotExamples());
        response.put("activeExamples", learningService.getActiveExamples());
        response.put("averageQuality", learningService.getAverageQuality());
        response.put("examples", learningService.getExampleDetails());
        
        return response;
    }
    
    /**
     * 정확도 상세 정보 조회
     */
    @GetMapping("/accuracy/detail")
    public Map<String, Object> getAccuracyDetails() {
        log.info("정확도 상세 정보 조회 요청");
        
        Map<String, Object> response = new HashMap<>();
        response.put("overallAccuracy", learningService.getCurrentAccuracy());
        response.put("recentAccuracy", learningService.getRecentAccuracy());
        response.put("evaluationCriteria", "표준 평가");
        response.put("parsingAccuracy", learningService.getParsingAccuracy());
        response.put("classificationAccuracy", learningService.getClassificationAccuracy());
        response.put("validationAccuracy", learningService.getValidationAccuracy());
        
        return response;
    }
    
    /**
     * 정확도 향상 상세 정보 조회
     */
    @GetMapping("/improvement/detail")
    public Map<String, Object> getImprovementDetails() {
        log.info("정확도 향상 상세 정보 조회 요청");
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalImprovement", learningService.getImprovement());
        response.put("recentImprovement", learningService.getRecentImprovement());
        response.put("improvementTrend", "안정");
        response.put("improvementHistory", learningService.getImprovementHistory());
        
        return response;
    }
    
    /**
     * Few-Shot 예시 수동 생성
     */
    @PostMapping("/few-shot/generate")
    public ResponseEntity<Map<String, Object>> generateFewShotExample(
            @RequestParam("insuCd") String insuCd,
            @RequestParam("productName") String productName,
            @RequestParam("inputText") String inputText,
            @RequestParam("outputInsuTerm") String outputInsuTerm,
            @RequestParam("outputPayTerm") String outputPayTerm,
            @RequestParam("outputAgeRange") String outputAgeRange,
            @RequestParam("outputRenew") String outputRenew) {
        
        log.info("Few-Shot 예시 수동 생성 요청: {}", insuCd);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Few-Shot 예시 수동 생성
            boolean success = learningService.createManualFewShotExample(
                insuCd, productName, inputText, 
                outputInsuTerm, outputPayTerm, outputAgeRange, outputRenew
            );
            
            if (success) {
                response.put("success", true);
                response.put("message", "Few-Shot 예시가 성공적으로 생성되었습니다.");
                response.put("insuCd", insuCd);
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "Few-Shot 예시 생성에 실패했습니다.");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
            
        } catch (Exception e) {
            log.error("Few-Shot 예시 생성 오류: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Few-Shot 예시 생성 중 오류가 발생했습니다: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * 수정 사항 상세 조회 (페이징 지원)
     */
    @GetMapping("/corrections/detailed")
    public Map<String, Object> getDetailedCorrections(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String insuCd,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("=== 수정 사항 상세 조회 API 요청 ===");
        log.info("📥 요청 파라미터: page={}, size={}, insuCd={}, startDate={}, endDate={}", 
            page, size, insuCd, startDate, endDate);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> corrections = learningService.getDetailedCorrections(page, size, insuCd, startDate, endDate);
            int totalCount = learningService.getTotalCorrections();
            
            log.info("📊 응답 데이터: corrections={}건, totalCount={}건", corrections.size(), totalCount);
            
            response.put("corrections", corrections);
            response.put("totalCount", totalCount);
            response.put("page", page);
            response.put("size", size);
            
            log.info("✅ 수정 사항 상세 조회 API 응답 완료");
            
        } catch (Exception e) {
            log.error("❌ 수정 사항 상세 조회 API 오류: {}", e.getMessage(), e);
            response.put("corrections", new ArrayList<>());
            response.put("totalCount", 0);
            response.put("page", page);
            response.put("size", size);
            response.put("error", e.getMessage());
        }
        
        return response;
    }
    
    /**
     * 수정 사항 전체 조회 (테스트용)
     */
    @GetMapping("/corrections/all")
    public Map<String, Object> getAllCorrections() {
        log.info("=== 수정 사항 전체 조회 API 요청 (테스트용) ===");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> corrections = learningService.getAllDetailedCorrections();
            int totalCount = learningService.getTotalCorrections();
            
            log.info("📊 전체 조회 결과: corrections={}건, totalCount={}건", corrections.size(), totalCount);
            
            response.put("corrections", corrections);
            response.put("totalCount", totalCount);
            response.put("success", true);
            
            log.info("✅ 수정 사항 전체 조회 API 응답 완료");
            
        } catch (Exception e) {
            log.error("❌ 수정 사항 전체 조회 API 오류: {}", e.getMessage(), e);
            response.put("corrections", new ArrayList<>());
            response.put("totalCount", 0);
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }
    
    /**
     * 특정 수정 사항 상세 조회
     */
    @GetMapping("/corrections/{id}")
    public Map<String, Object> getCorrectionDetail(@PathVariable Long id) {
        log.info("수정 사항 상세 조회 요청: id={}", id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("correction", learningService.getCorrectionById(id));
        
        return response;
    }
    
    /**
     * 학습된 패턴 상세 조회 (페이징 지원)
     */
    @GetMapping("/patterns/detailed")
    public Map<String, Object> getDetailedPatterns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String insuCd) {
        log.info("학습된 패턴 상세 조회 요청: page={}, size={}, fieldName={}", page, size, fieldName);
        
        Map<String, Object> response = new HashMap<>();
        response.put("patterns", learningService.getDetailedPatterns(page, size, fieldName, insuCd));
        response.put("totalCount", learningService.getTotalPatterns());
        response.put("page", page);
        response.put("size", size);
        
        return response;
    }
    
    /**
     * Few-Shot 예시 상세 조회 (페이징 지원)
     */
    @GetMapping("/few-shot/detailed")
    public Map<String, Object> getDetailedFewShotExamples(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String insuCd) {
        log.info("Few-Shot 예시 상세 조회 요청: page={}, size={}, insuCd={}", page, size, insuCd);
        
        Map<String, Object> response = new HashMap<>();
        response.put("examples", learningService.getDetailedFewShotExamples(page, size, insuCd));
        response.put("totalCount", learningService.getTotalFewShotExamples());
        response.put("page", page);
        response.put("size", size);
        
        return response;
    }
    
    /**
     * 정확도 향상 상세 분석
     */
    @GetMapping("/accuracy/analysis")
    public Map<String, Object> getAccuracyAnalysis(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("정확도 향상 상세 분석 요청: startDate={}, endDate={}", startDate, endDate);
        
        Map<String, Object> response = new HashMap<>();
        response.put("fieldAccuracy", learningService.getFieldAccuracyAnalysis());
        response.put("trendAnalysis", learningService.getAccuracyTrendAnalysis(startDate, endDate));
        response.put("improvementFactors", learningService.getImprovementFactors());
        
        return response;
    }
    
    /**
     * Few-Shot 예시 일괄 생성 (테스트용)
     */
    @PostMapping("/few-shot/generate-batch")
    public ResponseEntity<Map<String, Object>> generateBatchFewShotExamples() {
        log.info("Few-Shot 예시 일괄 생성 요청");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            int generatedCount = learningService.generateBatchFewShotExamples();
            
            response.put("success", true);
            response.put("message", "Few-Shot 예시 " + generatedCount + "개가 생성되었습니다.");
            response.put("generatedCount", generatedCount);
            return new ResponseEntity<>(response, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("Few-Shot 예시 일괄 생성 오류: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Few-Shot 예시 일괄 생성 중 오류가 발생했습니다: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * 수정 요청 DTO
     */
    public static class CorrectionRequest {
        private String insuCd;
        private Map<String, String> originalResult;
        private Map<String, String> correctedResult;
        private String pdfText;
        private String correctionReason;
        
        // Getters and Setters
        public String getInsuCd() { return insuCd; }
        public void setInsuCd(String insuCd) { this.insuCd = insuCd; }
        
        public Map<String, String> getOriginalResult() { return originalResult; }
        public void setOriginalResult(Map<String, String> originalResult) { this.originalResult = originalResult; }
        
        public Map<String, String> getCorrectedResult() { return correctedResult; }
        public void setCorrectedResult(Map<String, String> correctedResult) { this.correctedResult = correctedResult; }
        
        public String getPdfText() { return pdfText; }
        public void setPdfText(String pdfText) { this.pdfText = pdfText; }
        
        public String getCorrectionReason() { return correctionReason; }
        public void setCorrectionReason(String correctionReason) { this.correctionReason = correctionReason; }
    }
    
    /**
     * 테스트 데이터 조회 (디버깅용)
     */
    @GetMapping("/corrections/test")
    public ResponseEntity<Map<String, Object>> getTestData() {
        try {
            log.info("=== 테스트 데이터 조회 API 요청 ===");
            
            List<Map<String, Object>> testData = correctionLogMapper.selectTestData();
            
            Map<String, Object> response = new HashMap<>();
            response.put("testData", testData);
            response.put("count", testData.size());
            
            log.info("📊 테스트 데이터 조회 결과: {}건", testData.size());
            
            // 디버깅: 첫 번째 데이터 출력
            if (!testData.isEmpty()) {
                Map<String, Object> firstData = testData.get(0);
                log.info("🔍 첫 번째 테스트 데이터:");
                for (Map.Entry<String, Object> entry : firstData.entrySet()) {
                    log.info("  - {}: {}", entry.getKey(), entry.getValue());
                }
                
                // 상세 디버깅: 각 키별로 테스트
                response.put("debugKeys", firstData.keySet());
                response.put("debugValues", firstData);
            }
            
            log.info("✅ 테스트 데이터 조회 API 처리 완료");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 테스트 데이터 조회 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * selectDetailed 메서드 직접 테스트 (디버깅용)
     */
    @GetMapping("/corrections/test-detailed")
    public ResponseEntity<Map<String, Object>> getTestDetailed() {
        try {
            log.info("=== selectDetailed 직접 테스트 API 요청 ===");

            List<Map<String, Object>> detailedData = correctionLogMapper.selectDetailed(0, 3, null, null, null);

            Map<String, Object> response = new HashMap<>();
            response.put("detailedData", detailedData);
            response.put("count", detailedData.size());

            log.info("📊 selectDetailed 조회 결과: {}건", detailedData.size());

            // 디버깅: 첫 번째 데이터 출력
            if (!detailedData.isEmpty()) {
                Map<String, Object> firstData = detailedData.get(0);
                log.info("🔍 첫 번째 selectDetailed 데이터:");
                for (Map.Entry<String, Object> entry : firstData.entrySet()) {
                    log.info("  - {}: {}", entry.getKey(), entry.getValue());
                }

                response.put("debugKeys", firstData.keySet());
                response.put("debugValues", firstData);
            }

            log.info("✅ selectDetailed 테스트 API 처리 완료");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ selectDetailed 테스트 오류: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("stackTrace", e.getStackTrace());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/corrections/simple-test")
    public ResponseEntity<Map<String, Object>> getSimpleTest() {
        try {
            log.info("=== 간단한 테스트 API 요청 ===");
            
            // 가장 간단한 쿼리로 테스트
            List<Map<String, Object>> testData = correctionLogMapper.selectTestData();
            
            Map<String, Object> response = new HashMap<>();
            response.put("testData", testData);
            response.put("count", testData.size());
            
            log.info("📊 간단한 테스트 조회 결과: {}건", testData.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 간단한 테스트 오류: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("stackTrace", e.getStackTrace());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}



