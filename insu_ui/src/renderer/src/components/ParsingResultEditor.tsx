// components/ParsingResultEditor.tsx
// 파싱 결과 수정 및 학습 제출 컴포넌트

import React, { useState } from 'react';
import { ParsingResult, CorrectionRequest } from '../types/learning';
import { submitCorrection } from '../api/learningApi';
import './ParsingResultEditor.css';

interface Props {
  insuCd: string;
  originalResult: ParsingResult;
  pdfText: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export const ParsingResultEditor: React.FC<Props> = ({
  insuCd,
  originalResult,
  pdfText,
  onSubmitSuccess,
  onCancel,
}) => {
  const [editedResult, setEditedResult] = useState<ParsingResult>({
    ...originalResult,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [correctionReason, setCorrectionReason] = useState('');

  // 필드 변경 핸들러
  const handleFieldChange = (field: keyof ParsingResult, value: string) => {
    setEditedResult((prev) => ({
      ...prev,
      [field]: value,
    }));
    setMessage(''); // 메시지 초기화
  };

  // 수정 여부 확인
  const hasChanges = (): boolean => {
    return (
      editedResult.productName !== originalResult.productName ||
      editedResult.insuTerm !== originalResult.insuTerm ||
      editedResult.payTerm !== originalResult.payTerm ||
      editedResult.ageRange !== originalResult.ageRange ||
      editedResult.renew !== originalResult.renew
    );
  };

  // 수정된 필드 개수
  const getChangedFieldsCount = (): number => {
    let count = 0;
    if (editedResult.productName !== originalResult.productName) count++;
    if (editedResult.insuTerm !== originalResult.insuTerm) count++;
    if (editedResult.payTerm !== originalResult.payTerm) count++;
    if (editedResult.ageRange !== originalResult.ageRange) count++;
    if (editedResult.renew !== originalResult.renew) count++;
    return count;
  };

  // 제출 핸들러
  const handleSubmit = async () => {
    if (!hasChanges()) {
      setMessage('수정된 내용이 없습니다.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('학습 데이터 제출 중...');
    setMessageType('success');

    try {
      const request: CorrectionRequest = {
        insuCd,
        originalResult: {
          ...originalResult,
          productName: originalResult.productName || 'Unknown Product'
        },
        correctedResult: {
          ...editedResult,
          productName: editedResult.productName || 'Unknown Product'
        },
        pdfText,
        correctionReason,
      };

      // 🔍 API 호출 전 로그
      console.log('=== 프론트엔드 API 호출 시작 ===');
      console.log('📤 요청 데이터:', {
        insuCd: request.insuCd,
        originalResult: request.originalResult,
        correctedResult: request.correctedResult,
        correctionReason: request.correctionReason,
        pdfTextLength: request.pdfText?.length || 0
      });
      console.log('📤 수정된 필드 개수:', getChangedFieldsCount());
      console.log('📤 수정된 필드 목록:', {
        insuTerm: { original: request.originalResult.insuTerm, corrected: request.correctedResult.insuTerm },
        payTerm: { original: request.originalResult.payTerm, corrected: request.correctedResult.payTerm },
        ageRange: { original: request.originalResult.ageRange, corrected: request.correctedResult.ageRange },
        renew: { original: request.originalResult.renew, corrected: request.correctedResult.renew }
      });

      const response = await submitCorrection(request);

      // 🔍 API 응답 로그
      console.log('=== 프론트엔드 API 응답 수신 ===');
      console.log('📥 응답 데이터:', response);
      console.log('📥 응답 성공 여부:', response.success);
      console.log('📥 응답 메시지:', response.message);

      if (response.success) {
        setMessage(`✓ ${response.message || '학습이 완료되었습니다!'}`);
        setMessageType('success');
        
        // 🔍 이벤트 발생 로그
        console.log('=== 프론트엔드 이벤트 발생 시작 ===');
        console.log('🎯 dataUpdated 이벤트 발생');
        window.dispatchEvent(new CustomEvent('dataUpdated'));
        
        console.log('🎯 correctionLogged 이벤트 발생:', { 
          insuCd, 
          changedFields: getChangedFieldsCount() 
        });
        window.dispatchEvent(new CustomEvent('correctionLogged', { 
          detail: { insuCd, changedFields: getChangedFieldsCount() } 
        }));
        
        // 🔍 지연 새로고침 로그
        console.log('⏰ 5초 후 지연 새로고침 예약');
        setTimeout(() => {
          console.log('🔄 수정 제출 후 강제 새로고침 (5초)');
          window.dispatchEvent(new CustomEvent('dataUpdated'));
        }, 5000);
        
        console.log('⏰ 10초 후 최종 새로고침 예약');
        setTimeout(() => {
          console.log('🔄 수정 제출 후 최종 새로고침 (10초)');
          window.dispatchEvent(new CustomEvent('dataUpdated'));
        }, 10000);
        
        if (onSubmitSuccess) {
          console.log('✅ onSubmitSuccess 콜백 실행 예약 (1초)');
          // 수정된 데이터를 콜백으로 전달
          setTimeout(() => onSubmitSuccess(editedResult), 1000);
        }
      } else {
        console.log('❌ API 응답 실패:', response.message);
        setMessage(`✗ ${response.message || '학습 제출에 실패했습니다.'}`);
        setMessageType('error');
      }
    } catch (error) {
      // 🔍 오류 로그
      console.log('=== 프론트엔드 API 호출 오류 ===');
      console.log('❌ 오류 발생:', error);
      console.log('❌ 오류 타입:', typeof error);
      console.log('❌ 오류 메시지:', error instanceof Error ? error.message : String(error));
      console.log('❌ 오류 스택:', error instanceof Error ? error.stack : 'N/A');
      
      setMessage(`✗ 오류 발생: ${error}`);
      setMessageType('error');
    } finally {
      console.log('🏁 API 호출 완료 (성공/실패 관계없이)');
      setIsSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleReset = () => {
    setEditedResult({ ...originalResult });
    setMessage('');
    setCorrectionReason('');
  };

  // 필드가 수정되었는지 확인
  const isFieldModified = (field: keyof ParsingResult): boolean => {
    return editedResult[field] !== originalResult[field];
  };

  return (
    <div className="parsing-result-editor">
      <div className="editor-header">
        <h3>파싱 결과 확인 및 수정</h3>
        <span className="insu-cd-badge">{insuCd}</span>
      </div>

      <div className="form-container">
        {/* 상품명 */}
        <div className="form-group">
          <label className="form-label">
            상품명
            {isFieldModified('productName') && <span className="modified-badge">수정됨</span>}
          </label>
          <input
            type="text"
            value={editedResult.productName || ''}
            onChange={(e) => handleFieldChange('productName', e.target.value)}
            className={`form-input ${isFieldModified('productName') ? 'modified' : ''}`}
            placeholder="예: 종신보험, 연금보험, 정기보험"
          />
          {isFieldModified('productName') && (
            <span className="original-value">원본: {originalResult.productName}</span>
          )}
        </div>

        {/* 보험기간 */}
        <div className="form-group">
          <label className="form-label">
            보험기간
            {isFieldModified('insuTerm') && <span className="modified-badge">수정됨</span>}
          </label>
          <input
            type="text"
            value={editedResult.insuTerm || ''}
            onChange={(e) => handleFieldChange('insuTerm', e.target.value)}
            className={`form-input ${isFieldModified('insuTerm') ? 'modified' : ''}`}
            placeholder="예: 종신"
          />
          {isFieldModified('insuTerm') && (
            <span className="original-value">원본: {originalResult.insuTerm}</span>
          )}
        </div>

        {/* 납입기간 */}
        <div className="form-group">
          <label className="form-label">
            납입기간
            {isFieldModified('payTerm') && <span className="modified-badge">수정됨</span>}
          </label>
          <textarea
            value={editedResult.payTerm || ''}
            onChange={(e) => handleFieldChange('payTerm', e.target.value)}
            className={`form-textarea ${isFieldModified('payTerm') ? 'modified' : ''}`}
            rows={2}
            placeholder="예: 10년납, 15년납, 20년납, 30년납"
          />
          {isFieldModified('payTerm') && (
            <span className="original-value">원본: {originalResult.payTerm}</span>
          )}
        </div>

        {/* 가입나이 */}
        <div className="form-group">
          <label className="form-label">
            가입나이
            {isFieldModified('ageRange') && <span className="modified-badge">수정됨</span>}
          </label>
          <textarea
            value={editedResult.ageRange || ''}
            onChange={(e) => handleFieldChange('ageRange', e.target.value)}
            className={`form-textarea ${isFieldModified('ageRange') ? 'modified' : ''}`}
            rows={3}
            placeholder="예: 10년납(남:15~80,여:15~80), 15년납(남:15~70,여:15~70)"
          />
          {isFieldModified('ageRange') && (
            <span className="original-value">원본: {originalResult.ageRange}</span>
          )}
        </div>

        {/* 갱신여부 */}
        <div className="form-group">
          <label className="form-label">
            갱신여부
            {isFieldModified('renew') && <span className="modified-badge">수정됨</span>}
          </label>
          <select
            value={editedResult.renew || ''}
            onChange={(e) => handleFieldChange('renew', e.target.value)}
            className={`form-select ${isFieldModified('renew') ? 'modified' : ''}`}
          >
            <option value="">선택하세요</option>
            <option value="갱신형">갱신형</option>
            <option value="비갱신형">비갱신형</option>
          </select>
          {isFieldModified('renew') && (
            <span className="original-value">원본: {originalResult.renew}</span>
          )}
        </div>

        {/* 수정 이유 */}
        <div className="form-group">
          <label className="form-label">
            수정 이유 <span className="optional">(선택사항)</span>
          </label>
          <input
            type="text"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            className="form-input"
            placeholder="예: PDF에서 누락된 납입기간 추가"
          />
        </div>

        {/* 수정 요약 */}
        {hasChanges() && (
          <div className="changes-summary">
            <strong>수정된 필드: {getChangedFieldsCount()}개</strong>
          </div>
        )}
      </div>

      {/* 버튼 그룹 */}
      <div className="button-group">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !hasChanges()}
          className="btn-primary"
        >
          {isSubmitting ? '제출 중...' : '학습 제출'}
        </button>
        <button 
          onClick={handleReset} 
          className="btn-secondary" 
          disabled={isSubmitting || !hasChanges()}
        >
          초기화
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn-cancel" disabled={isSubmitting}>
            취소
          </button>
        )}
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
};

