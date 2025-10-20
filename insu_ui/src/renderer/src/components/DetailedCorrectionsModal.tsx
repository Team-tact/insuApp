// components/DetailedCorrectionsModal.tsx
// 수정 사항 상세 조회 모달 컴포넌트

import React, { useState, useEffect } from 'react';
import { httpGet } from '../api/client';
import './DetailedCorrectionsModal.css';

interface CorrectionDetail {
  id: number;
  insuCd: string;
  productName: string;
  timestamp: string;
  correctionReason: string;
  isLearned: string;
  changes: {
    insuTerm: { original: string; corrected: string; changed: boolean };
    payTerm: { original: string; corrected: string; changed: boolean };
    ageRange: { original: string; corrected: string; changed: boolean };
    renew: { original: string; corrected: string; changed: boolean };
  };
  fieldCount: number;
  pdfText: string;
}

interface DetailedCorrectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  insuCd?: string;
  startDate?: string;
  endDate?: string;
}

export const DetailedCorrectionsModal: React.FC<DetailedCorrectionsModalProps> = ({
  isOpen,
  onClose,
  insuCd,
  startDate,
  endDate
}) => {
  const [corrections, setCorrections] = useState<CorrectionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionDetail | null>(null);

  const pageSize = 10;

  // 수정 사항 상세 조회
  const loadCorrections = async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        size: pageSize.toString(),
        ...(insuCd && { insuCd }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      console.log('🔄 수정 사항 상세 조회 API 호출:', `/api/learning/corrections/detailed?${params}`);
      
      const data = await httpGet<{
        corrections: CorrectionDetail[];
        totalCount: number;
        page: number;
        size: number;
      }>(`/api/learning/corrections/detailed?${params}`);
      
      console.log('📥 API 응답:', data);
      
      setCorrections(data.corrections || []);
      setTotalCount(data.totalCount || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('수정 사항 상세 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 특정 수정 사항 상세 조회
  const loadCorrectionDetail = async (id: number) => {
    try {
      const data = await httpGet<{ correction: CorrectionDetail }>(`/api/learning/corrections/${id}`);
      setSelectedCorrection(data.correction);
    } catch (error) {
      console.error('수정 사항 상세 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCorrections(0);
    }
  }, [isOpen, insuCd, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    loadCorrections(newPage);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getFieldChangeIcon = (changed: boolean) => {
    return changed ? '🔄' : '➖';
  };

  const getLearningStatus = (isLearned: string) => {
    return isLearned === 'Y' ? '✅ 학습완료' : '⏳ 학습대기';
  };

  if (!isOpen) return null;

  return (
    <div className="detailed-corrections-modal-overlay">
      <div className="detailed-corrections-modal">
        <div className="modal-header">
          <h3>수정 사항 상세 조회</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* 필터 정보 */}
          <div className="filter-info">
            {insuCd && <span className="filter-tag">보험코드: {insuCd}</span>}
            {startDate && <span className="filter-tag">시작일: {startDate}</span>}
            {endDate && <span className="filter-tag">종료일: {endDate}</span>}
            <span className="total-count">총 {totalCount}건</span>
          </div>

          {/* 수정 사항 목록 */}
          <div className="corrections-list">
            {loading ? (
              <div className="loading">로딩 중...</div>
            ) : corrections.length === 0 ? (
              <div className="no-data">수정 사항이 없습니다.</div>
            ) : (
              corrections.map((correction) => (
                <div key={correction.id} className="correction-item">
                  <div className="correction-header">
                    <div className="correction-info">
                      <span className="insu-cd">{correction.insuCd}</span>
                      <span className="product-name">{correction.productName}</span>
                      <span className="timestamp">{formatTimestamp(correction.timestamp)}</span>
                    </div>
                    <div className="correction-actions">
                      <span className="field-count">{correction.fieldCount}개 필드 수정</span>
                      <span className="learning-status">{getLearningStatus(correction.isLearned)}</span>
                      <button 
                        className="detail-button"
                        onClick={() => loadCorrectionDetail(correction.id)}
                      >
                        상세보기
                      </button>
                    </div>
                  </div>

                  {/* 변경된 필드 표시 */}
                  <div className="field-changes">
                    <div className="field-change">
                      <span className="field-name">보험기간:</span>
                      <span className="change-icon">{getFieldChangeIcon(correction.changes.insuTerm.changed)}</span>
                      <span className="original">{correction.changes.insuTerm.original}</span>
                      {correction.changes.insuTerm.changed && (
                        <>
                          <span className="arrow">→</span>
                          <span className="corrected">{correction.changes.insuTerm.corrected}</span>
                        </>
                      )}
                    </div>
                    <div className="field-change">
                      <span className="field-name">납입기간:</span>
                      <span className="change-icon">{getFieldChangeIcon(correction.changes.payTerm.changed)}</span>
                      <span className="original">{correction.changes.payTerm.original}</span>
                      {correction.changes.payTerm.changed && (
                        <>
                          <span className="arrow">→</span>
                          <span className="corrected">{correction.changes.payTerm.corrected}</span>
                        </>
                      )}
                    </div>
                    <div className="field-change">
                      <span className="field-name">가입나이:</span>
                      <span className="change-icon">{getFieldChangeIcon(correction.changes.ageRange.changed)}</span>
                      <span className="original">{correction.changes.ageRange.original}</span>
                      {correction.changes.ageRange.changed && (
                        <>
                          <span className="arrow">→</span>
                          <span className="corrected">{correction.changes.ageRange.corrected}</span>
                        </>
                      )}
                    </div>
                    <div className="field-change">
                      <span className="field-name">갱신형:</span>
                      <span className="change-icon">{getFieldChangeIcon(correction.changes.renew.changed)}</span>
                      <span className="original">{correction.changes.renew.original}</span>
                      {correction.changes.renew.changed && (
                        <>
                          <span className="arrow">→</span>
                          <span className="corrected">{correction.changes.renew.corrected}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {correction.correctionReason && (
                    <div className="correction-reason">
                      <strong>수정 이유:</strong> {correction.correctionReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 페이징 */}
          {totalCount > pageSize && (
            <div className="pagination">
              <button 
                disabled={page === 0}
                onClick={() => handlePageChange(page - 1)}
              >
                이전
              </button>
              <span className="page-info">
                {page + 1} / {Math.ceil(totalCount / pageSize)}
              </span>
              <button 
                disabled={(page + 1) * pageSize >= totalCount}
                onClick={() => handlePageChange(page + 1)}
              >
                다음
              </button>
            </div>
          )}
        </div>

        {/* 상세 모달 */}
        {selectedCorrection && (
          <div className="correction-detail-modal">
            <div className="detail-modal-content">
              <div className="detail-header">
                <h4>수정 사항 상세 정보</h4>
                <button onClick={() => setSelectedCorrection(null)}>×</button>
              </div>
              <div className="detail-body">
                <div className="detail-section">
                  <h5>기본 정보</h5>
                  <p><strong>보험코드:</strong> {selectedCorrection.insuCd}</p>
                  <p><strong>상품명:</strong> {selectedCorrection.productName}</p>
                  <p><strong>수정 시간:</strong> {formatTimestamp(selectedCorrection.timestamp)}</p>
                  <p><strong>수정 필드 수:</strong> {selectedCorrection.fieldCount}개</p>
                  <p><strong>학습 상태:</strong> {getLearningStatus(selectedCorrection.isLearned)}</p>
                </div>
                
                <div className="detail-section">
                  <h5>변경 내역</h5>
                  <div className="changes-detail">
                    {Object.entries(selectedCorrection.changes).map(([field, change]) => (
                      <div key={field} className="change-detail">
                        <h6>{field === 'insuTerm' ? '보험기간' : 
                             field === 'payTerm' ? '납입기간' :
                             field === 'ageRange' ? '가입나이' : '갱신형'}</h6>
                        <div className="change-comparison">
                          <div className="original-value">
                            <strong>원본:</strong> {change.original || '없음'}
                          </div>
                          <div className="corrected-value">
                            <strong>수정:</strong> {change.corrected || '없음'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCorrection.correctionReason && (
                  <div className="detail-section">
                    <h5>수정 이유</h5>
                    <p>{selectedCorrection.correctionReason}</p>
                  </div>
                )}

                {selectedCorrection.pdfText && (
                  <div className="detail-section">
                    <h5>PDF 원문</h5>
                    <div className="pdf-text">
                      {selectedCorrection.pdfText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
