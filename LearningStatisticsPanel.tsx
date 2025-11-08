// components/LearningStatisticsPanel.tsx
// 증분 학습 통계 대시보드 컴포넌트

import React, { useEffect, useState } from 'react';
import { LearningStatistics } from '../types/learning';
import { fetchStatistics, fetchRevisionDetails, fetchPatternDetails, fetchExampleDetails, fetchAccuracyDetails, fetchImprovementDetails } from '../api/learningApi';
import { LearningStatisticsModal } from './LearningStatisticsModal';
import { DetailedCorrectionsModal } from './DetailedCorrectionsModal';
import { useAppStore } from '../store/useAppStore';
import './LearningStatisticsPanel.css';

export const LearningStatisticsPanel: React.FC = () => {
  const store = useAppStore() as any;
  const { learningStats } = store;
  
  const [statistics, setStatistics] = useState<LearningStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'revisions' | 'patterns' | 'examples' | 'accuracy' | 'improvement' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  
  // 상세 수정 사항 모달 상태
  const [isDetailedCorrectionsOpen, setIsDetailedCorrectionsOpen] = useState(false);
  const [correctionsFilter, setCorrectionsFilter] = useState<{
    insuCd?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  // 통계 로드
  const loadStatistics = async () => {
    console.log('=== 통계 로드 시작 ===');
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 API 호출 시작: fetchStatistics()');
      const data = await fetchStatistics();
      console.log('✅ API 호출 성공:', data);
      
      setStatistics(data);
      setLastUpdated(new Date());
      console.log('✅ 통계 상태 업데이트 완료');
    } catch (err) {
      console.log('❌ 통계 로드 실패:', err);
      setError(`통계 로드 실패: ${err}`);
    } finally {
      console.log('🏁 통계 로드 완료');
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 로드
  useEffect(() => {
    loadStatistics();
  }, []);

  // 스토어의 learningStats가 변경될 때마다 statistics 상태 업데이트
  useEffect(() => {
    if (learningStats) {
      console.log('🔄 스토어에서 학습 통계 업데이트:', learningStats);
      setStatistics(learningStats);
      setLastUpdated(new Date());
    }
  }, [learningStats]);

  // 자동 새로고침 삭제됨 (사용자 요청)

  // 수정 이벤트 리스너 (실시간 반영) - 모달 열려있을 때는 새로고침 안함
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      console.log('=== 프론트엔드 이벤트 수신 ===');
      console.log('🎯 이벤트 타입:', event.type);
      console.log('🎯 이벤트 상세:', event.detail);
      console.log('🎯 모달 상태:', isModalOpen);
      
      // 모달이 열려있으면 새로고침하지 않음 (팝업창 닫힘 방지)
      if (isModalOpen) {
        console.log('⏭️ 모달이 열려있어서 새로고침 건너뜀');
        return;
      }
      
      console.log('🔄 데이터 수정 감지, 통계 새로고침 시작');
      // 즉시 새로고침
      loadStatistics();
      
      // 5초 후 한 번 더 새로고침 (백엔드 처리 완료 대기)
      setTimeout(() => {
        if (!isModalOpen) { // 모달이 여전히 닫혀있을 때만
          console.log('🔄 지연 새로고침 실행 (5초)');
          loadStatistics();
        } else {
          console.log('⏭️ 모달이 열려있어서 지연 새로고침 건너뜀 (5초)');
        }
      }, 5000);
      
      // 10초 후 한 번 더 새로고침 (백엔드 처리 완료 확실)
      setTimeout(() => {
        if (!isModalOpen) { // 모달이 여전히 닫혀있을 때만
          console.log('🔄 지연 새로고침 실행 (10초)');
          loadStatistics();
        } else {
          console.log('⏭️ 모달이 열려있어서 지연 새로고침 건너뜀 (10초)');
        }
      }, 10000);
    };

    // 전역 이벤트 리스너 등록
    window.addEventListener('dataUpdated', handleDataUpdate);
    window.addEventListener('correctionLogged', handleDataUpdate);
    window.addEventListener('fewShotGenerated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('correctionLogged', handleDataUpdate);
      window.removeEventListener('fewShotGenerated', handleDataUpdate);
    };
  }, []);

  // 모달 열기 핸들러
  const handleStatClick = async (type: 'revisions' | 'patterns' | 'examples' | 'accuracy' | 'improvement') => {
    // 수정 건수 클릭 시 상세 모달 열기
    if (type === 'revisions') {
      setIsDetailedCorrectionsOpen(true);
      return;
    }
    
    setModalType(type);
    setIsModalOpen(true);
    
    try {
      let data;
      switch (type) {
        case 'revisions':
          data = await fetchRevisionDetails();
          break;
        case 'patterns':
          data = await fetchPatternDetails();
          break;
        case 'examples':
          data = await fetchExampleDetails();
          break;
        case 'accuracy':
          data = await fetchAccuracyDetails();
          break;
        case 'improvement':
          data = await fetchImprovementDetails();
          break;
      }
      setModalData(data);
    } catch (error) {
      console.error(`${type} 상세 데이터 로드 실패:`, error);
      setModalData(null);
    }
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalType(null);
    setModalData(null);
  };

  // 수동 새로고침 핸들러
  const handleManualRefresh = () => {
    console.log('수동 새로고침 실행');
    loadStatistics();
  };

  if (loading) {
    return (
      <div className="statistics-panel loading">
        <div className="spinner"></div>
        <p>통계 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-panel error">
        <p className="error-message">{error}</p>
        <button onClick={loadStatistics} className="btn-retry">
          다시 시도
        </button>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="statistics-panel empty">
        <p>통계 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="learning-statistics-panel">
      <div className="panel-header">
        <h3>📊 증분 학습 통계</h3>
        <button onClick={loadStatistics} className="btn-refresh" title="새로고침">
          🔄
        </button>
      </div>

      <div className="stats-grid">
        {/* 총 수정 건수 */}
        <div className="stat-card clickable" onClick={() => handleStatClick('revisions')}>
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-label">총 수정 건수</div>
            <div className="stat-value">{statistics.totalCorrections}건</div>
          </div>
        </div>

        {/* 학습된 패턴 */}
        <div className="stat-card clickable" onClick={() => handleStatClick('patterns')}>
          <div className="stat-icon">🧠</div>
          <div className="stat-content">
            <div className="stat-label">학습된 패턴</div>
            <div className="stat-value">{statistics.totalPatterns}개</div>
          </div>
        </div>

        {/* Few-Shot 예시 */}
        <div className="stat-card clickable" onClick={() => handleStatClick('examples')}>
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-label">Few-Shot 예시</div>
            <div className="stat-value">
              {(statistics as any).fewShotExamples !== null && (statistics as any).fewShotExamples !== undefined 
                ? `${(statistics as any).fewShotExamples}개` 
                : statistics.totalFewShotExamples !== null && statistics.totalFewShotExamples !== undefined 
                ? `${statistics.totalFewShotExamples}개` 
                : '0개'}
            </div>
          </div>
        </div>

        {/* 현재 정확도 */}
        <div className="stat-card highlight clickable" onClick={() => handleStatClick('accuracy')}>
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-label">현재 정확도</div>
            <div className="stat-value">{statistics.currentAccuracy.toFixed(1)}%</div>
          </div>
        </div>

        {/* 정확도 향상 */}
        <div className="stat-card highlight clickable" onClick={() => handleStatClick('improvement')}>
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">정확도 향상</div>
            <div className={`stat-value ${statistics.improvement >= 0 ? 'positive' : 'negative'}`}>
              {statistics.improvement >= 0 ? '+' : ''}{statistics.improvement.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 필드별 정확도 */}
      {(statistics.insuTermAccuracy || statistics.payTermAccuracy || 
        statistics.ageRangeAccuracy || statistics.renewAccuracy) && (
        <div className="field-accuracy-section">
          <h4>📊 필드별 정확도</h4>
          <div className="field-accuracy-grid">
            {statistics.insuTermAccuracy && (
              <div className="field-accuracy-item">
                <span className="field-label">보험기간</span>
                <span className="field-value">{statistics.insuTermAccuracy.toFixed(1)}%</span>
              </div>
            )}
            {statistics.payTermAccuracy && (
              <div className="field-accuracy-item">
                <span className="field-label">납입기간</span>
                <span className="field-value">{statistics.payTermAccuracy.toFixed(1)}%</span>
              </div>
            )}
            {statistics.ageRangeAccuracy && (
              <div className="field-accuracy-item">
                <span className="field-label">가입나이</span>
                <span className="field-value">{statistics.ageRangeAccuracy.toFixed(1)}%</span>
              </div>
            )}
            {statistics.renewAccuracy && (
              <div className="field-accuracy-item">
                <span className="field-label">갱신여부</span>
                <span className="field-value">{statistics.renewAccuracy.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 마지막 업데이트 시간 */}
      <div className="panel-footer">
        <span className="last-updated">
          마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
        </span>
      </div>

      {/* 통계 상세 모달 */}
      <LearningStatisticsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        modalType={modalType}
        data={modalData}
      />

      {/* 상세 수정 사항 모달 */}
      <DetailedCorrectionsModal
        isOpen={isDetailedCorrectionsOpen}
        onClose={() => setIsDetailedCorrectionsOpen(false)}
        insuCd={correctionsFilter.insuCd}
        startDate={correctionsFilter.startDate}
        endDate={correctionsFilter.endDate}
      />
    </div>
  );
};


