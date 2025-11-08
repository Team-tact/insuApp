import React from 'react';

interface LearningStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: 'revisions' | 'patterns' | 'examples' | 'accuracy' | 'improvement' | null;
  data?: any;
}

export function LearningStatisticsModal({ isOpen, onClose, modalType, data }: LearningStatisticsModalProps) {
  if (!isOpen || !modalType) return null;

  const renderModalContent = () => {
    switch (modalType) {
      case 'revisions':
        return (
          <div className="modal-content">
            <h3>총 수정 건수 상세</h3>
            <div className="stats-detail">
              <div className="detail-item">
                <span className="label">전체 수정 건수:</span>
                <span className="value">{data?.totalRevisions || 0}건</span>
              </div>
              <div className="detail-item">
                <span className="label">최근 수정:</span>
                <span className="value">{data?.lastRevision || '없음'}</span>
              </div>
              <div className="detail-item">
                <span className="label">수정 빈도:</span>
                <span className="value">{data?.revisionFrequency || '일일 평균 0.5건'}</span>
              </div>
            </div>
            <div className="revision-list">
              <h4>최근 수정 이력</h4>
              <div className="list-container">
                {data?.recentRevisions?.map((revision: any, index: number) => (
                  <div key={index} className="revision-item">
                    <div className="revision-header">
                      <span className="revision-date">{revision.date}</span>
                      <span className="revision-type">{revision.type}</span>
                    </div>
                    <div className="revision-content">{revision.content}</div>
                  </div>
                )) || (
                  <div className="no-data">수정 이력이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'patterns':
        return (
          <div className="modal-content">
            <h3>학습된 패턴 상세</h3>
            <div className="stats-detail">
              <div className="detail-item">
                <span className="label">전체 패턴 수:</span>
                <span className="value">{data?.totalPatterns || 0}개</span>
              </div>
              <div className="detail-item">
                <span className="label">활성 패턴:</span>
                <span className="value">{data?.activePatterns || 0}개</span>
              </div>
              <div className="detail-item">
                <span className="label">신규 패턴:</span>
                <span className="value">{data?.newPatterns || 0}개</span>
              </div>
            </div>
            <div className="pattern-list">
              <h4>주요 학습 패턴</h4>
              <div className="list-container">
                {data?.patterns?.map((pattern: any, index: number) => (
                  <div key={index} className="pattern-item">
                    <div className="pattern-header">
                      <span className="pattern-name">{pattern.name}</span>
                      <span className="pattern-confidence">{pattern.confidence}%</span>
                    </div>
                    <div className="pattern-description">{pattern.description}</div>
                    <div className="pattern-usage">사용 횟수: {pattern.usageCount}회</div>
                  </div>
                )) || (
                  <div className="no-data">학습된 패턴이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'examples':
        return (
          <div className="modal-content">
            <h3>Few-Shot 예시 상세</h3>
            <div className="stats-detail">
              <div className="detail-item">
                <span className="label">전체 예시 수:</span>
                <span className="value">{data?.totalExamples || 0}개</span>
              </div>
              <div className="detail-item">
                <span className="label">활성 예시:</span>
                <span className="value">{data?.activeExamples || 0}개</span>
              </div>
              <div className="detail-item">
                <span className="label">평균 품질:</span>
                <span className="value">{data?.averageQuality || 'N/A'}</span>
              </div>
            </div>
            <div className="example-list">
              <h4>Few-Shot 예시 목록</h4>
              <div className="list-container">
                {data?.examples?.map((example: any, index: number) => (
                  <div key={index} className="example-item">
                    <div className="example-header">
                      <span className="example-title">{example.title}</span>
                      <span className="example-quality">품질: {example.quality}%</span>
                    </div>
                    <div className="example-content">{example.content}</div>
                    <div className="example-meta">
                      <span>생성일: {example.createdAt}</span>
                      <span>사용 횟수: {example.usageCount}회</span>
                    </div>
                  </div>
                )) || (
                  <div className="no-data">Few-Shot 예시가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'accuracy':
        return (
          <div className="modal-content">
            <h3>현재 정확도 상세</h3>
            <div className="stats-detail">
              <div className="detail-item">
                <span className="label">전체 정확도:</span>
                <span className="value">{data?.overallAccuracy || 0}%</span>
              </div>
              <div className="detail-item">
                <span className="label">최근 정확도:</span>
                <span className="value">{data?.recentAccuracy || 0}%</span>
              </div>
              <div className="detail-item">
                <span className="label">평가 기준:</span>
                <span className="value">{data?.evaluationCriteria || '표준 평가'}</span>
              </div>
            </div>
            <div className="accuracy-breakdown">
              <h4>정확도 분석</h4>
              <div className="breakdown-item">
                <span className="breakdown-label">파싱 정확도:</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${data?.parsingAccuracy || 0}%` }}
                  ></div>
                  <span className="progress-text">{data?.parsingAccuracy || 0}%</span>
                </div>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">분류 정확도:</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${data?.classificationAccuracy || 0}%` }}
                  ></div>
                  <span className="progress-text">{data?.classificationAccuracy || 0}%</span>
                </div>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">검증 정확도:</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${data?.validationAccuracy || 0}%` }}
                  ></div>
                  <span className="progress-text">{data?.validationAccuracy || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'improvement':
        return (
          <div className="modal-content">
            <h3>정확도 향상 상세</h3>
            <div className="stats-detail">
              <div className="detail-item">
                <span className="label">전체 향상률:</span>
                <span className="value">{data?.totalImprovement || 0}%</span>
              </div>
              <div className="detail-item">
                <span className="label">최근 향상:</span>
                <span className="value">{data?.recentImprovement || 0}%</span>
              </div>
              <div className="detail-item">
                <span className="label">향상 트렌드:</span>
                <span className="value">{data?.improvementTrend || '안정'}</span>
              </div>
            </div>
            <div className="improvement-chart">
              <h4>향상 이력</h4>
              <div className="chart-container">
                {data?.improvementHistory?.map((item: any, index: number) => (
                  <div key={index} className="chart-item">
                    <div className="chart-date">{item.date}</div>
                    <div className="chart-bar">
                      <div 
                        className="chart-fill"></div>
                    </div>
                    <div className="chart-value">{item.improvement}%</div>
                  </div>
                )) || (
                  <div className="no-data">향상 이력이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>증분 학습 통계 상세</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        {renderModalContent()}
      </div>
    </div>
  );
}












