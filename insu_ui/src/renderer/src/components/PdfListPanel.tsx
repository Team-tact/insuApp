import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { uploadPdfFile } from "../api/learningApi";

export function PdfListPanel() {
  const { pdfs, listPdfs, listCodes, pickPdf, setPickPdf } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => { listPdfs(); }, [listPdfs]);

  // 드래그 이벤트 핸들러들 - 카운터 방식으로 안정적인 드래그 상태 관리
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 드래그된 항목이 파일인지 확인
    if (e.dataTransfer.types.includes('Files')) {
      setDragCounter(prev => prev + 1);
      if (dragCounter === 0) {
        setIsDragOver(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragOver(false);
      }
      return newCount;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      alert('PDF 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);

    try {
      for (const file of pdfFiles) {
        console.log(`PDF 파일 업로드 시작: ${file.name}`);
        const result = await uploadPdfFile(file);
        
        if (result.success) {
          console.log(`PDF 파일 업로드 성공: ${file.name}`);
        } else {
          console.error(`PDF 파일 업로드 실패: ${file.name} - ${result.message}`);
          alert(`파일 업로드 실패: ${file.name}\n${result.message}`);
        }
      }
      
      // 업로드 완료 후 PDF 리스트 새로고침
      await listPdfs();
      
    } catch (error) {
      console.error('PDF 파일 업로드 중 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className={`panel left ${isDragOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 드래그&드랍 영역 표시 */}
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-message">
            PDF 파일을 여기에 드롭하세요
          </div>
        </div>
      )}
      
      {/* 업로드 중 표시 */}
      {isUploading && (
        <div className="upload-overlay">
          <div className="upload-message">
            파일 업로드 중...
          </div>
        </div>
      )}

      {/* PDF 리스트 */}
      <ul className="pdf-list">
        {pdfs.map(p => {
          const fname = p.name.replace(/\.pdf$/i, "");
          const active = pickPdf === p.name;
          return (
            <li
              key={p.name}
              className={active ? "active" : ""}
              onClick={() => {
                setPickPdf(p.name); // 선택 상태 업데이트
                listCodes(p.name);
              }}
              title={p.name}
            >
              {fname}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
