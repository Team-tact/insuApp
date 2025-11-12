import { useEffect, useState } from "react";
import "../App.css";

// 스토어와 패널은 기존 그대로 사용
import { useAppStore } from "../store/useAppStore";
import { PdfListPanel } from "./PdfListPanel";

// 증분 학습 관련 컴포넌트 추가
import { ParsingResultEditor } from "./ParsingResultEditor";
import { LearningStatisticsPanel } from "./LearningStatisticsPanel";
import { fetchStatistics } from "../api/learningApi";

const CalculatorComponent = () => {

  // TS 속성 미스매치로 인한 빌드 중단 방지(스토어 타입은 그대로 둠)
  const store = useAppStore() as any;
  const { listPdfs, product, limit, setAge: setStoreAge, setBaseAmount: setStoreBaseAmount, productRows, errorMessages, codes, selectedMainCode } = store;

  const [age, setAge] = useState<number>(15);
  const [baseAmount, setBaseAmount] = useState<number>(100);
  const [codeInput, setCodeInput] = useState<string>('');
  
  // 증분 학습 관련 상태 추가
  const [showEditor, setShowEditor] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // 좌측 PDF 리스트 로드
  useEffect(() => { listPdfs && listPdfs(); }, [listPdfs]);
  
  // 학습 통계 로드
  useEffect(() => {
    loadLearningStats();
  }, []);

  // 코드 선택 처리 함수
  const handleCodeSelect = () => {
    if (!codeInput.trim()) return;
    
    // codes 배열에서 입력된 코드 찾기
    const foundCode = codes?.find((code: any) => code.insuCd === codeInput.trim());
    
    if (foundCode) {
      // 스토어의 selectMainCode 호출하여 선택 처리
      store.selectMainCode(codeInput.trim());
      setCodeInput(''); // 입력칸 초기화
    } else {
      alert('해당 코드를 찾을 수 없습니다.');
    }
  };

  
  const loadLearningStats = async () => {
    try {
      const stats = await fetchStatistics();
      console.log('학습 통계 로드됨:', stats);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };
  
  // 행 클릭 핸들러
  const handleRowClick = (row: any) => {
    setSelectedRow(row);
    setShowEditor(true);
  };

return(
  <div className="app">
      <header className="topbar">
        <div className="title">산출테스트</div>
      </header>

      <main className="layout">
        {/* 좌측 열: PDF 리스트(확장자 .pdf 제거는 PdfListPanel 내부 로직 유지) */}
        <aside className="left-pane">
          <div className="pane-title">리스트</div>
          <PdfListPanel />
          
        </aside>

        {/* 우측 열: 본문 */}
        <section className="right-pane">

          {/* 1) 코드(주계약/특약) 선택 바 : 최대 2줄 + 스크롤 */}
          <div className="header-grid">
            {/* 상품선택 카드 */}
            <div className="product-card">
              <div className="badge">상품선택</div>
              <div className="product-code-display">
                {codes && codes.length > 0 ? (
                  <div className="code-buttons-container">
                    {codes.map((code: any) => (
                      <button
                        key={code.insuCd}
                        className={`code-button ${selectedMainCode === code.insuCd ? 'selected' : ''}`}
                        onClick={() => store.selectMainCode(code.insuCd)}
                        title={code.name}
                      >
                        {code.insuCd}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-codes">상품을 선택하세요</div>
                )}
              </div>
            </div>

            {/* 나이선택 및 기준금액 – 별도 카드(오른쪽) */}
            <div className="age-card">
              <div className="input-group">
                <label className="input-label">나이선택</label>
                <input
                  className="age-input"
                  type="number"
                  min={15}
                  value={age}
                  onChange={(e) => {
                    const newAge = Number.isFinite(+e.target.value) ? parseInt(e.target.value, 10) : 15;
                    setAge(newAge);
                    setStoreAge(newAge);
                  }}
                />
              </div>
              <div className="input-group">
                <label className="input-label">기준금액</label>
                <input
                  className="amount-input"
                  type="number"
                  min={1}
                  value={baseAmount}
                  onChange={(e) => {
                    const newAmount = Number.isFinite(+e.target.value) ? parseInt(e.target.value, 10) : 100;
                    setBaseAmount(newAmount);
                    setStoreBaseAmount(newAmount);
                    
                    // 보험료 재계산
                    if (selectedMainCode) {
                      store.calculatePremium(selectedMainCode, newAmount);
                    }
                  }}
                />
              </div>
              <div className="input-group">
                <label className="input-label">코드선택</label>
                <input
                  className="code-input"
                  type="text"
                  placeholder="코드를 입력하세요"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCodeSelect()}
                />
              </div>
            </div>
          </div>

          {/* 2) 통합 표 구성 */}
          <div className="tables">
            <div className="unified-grid">
              <div className="thead">
                <div className="th code">보험코드</div>
                <div className="th name">명칭</div>
                <div className="th insu">보험기간</div>
                <div className="th pay">납입기간</div>
                <div className="th age">가입나이</div>
                <div className="th data">데이터</div>
                <div className="th min">보험료(남)</div>
                <div className="th max">보험료(여)</div>
              </div>

              <div className="tbody">
                {/* 다중 행 표시: 주계약 + 관련 특약들 */}
                {productRows.length > 0 ? (
                  productRows.map((row: any, index: number) => (
                    <div 
                      key={`${row.insuCd}-${row.insuTerm}-${row.payTerm}-${index}`} 
                      className="trow clickable"
                      onClick={() => handleRowClick(row)}
                      title="클릭하여 데이터 수정"
                    >
                      <div className="td code">{row.insuCd}</div>
                      <div className="td name">{row.name ?? "—"}</div>
                      <div className="td insu">{row.insuTerm ?? "—"}</div>
                      <div className="td pay">{row.payTerm ?? "—"}</div>
                      <div className="td age">{row.ageRange ?? "—"}</div>
                      <div className="td data">
                        {row.dataAvailable || "—"}
                      </div>
                      <div className="td min mono">
                        {row.manPremium ? prettyKR(row.manPremium) : "—"}
                      </div>
                      <div className="td max mono">
                        {row.fmlPremium ? prettyKR(row.fmlPremium) : "—"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div 
                    className="trow clickable"
                    onClick={() => handleRowClick({
                      insuCd: selectedMainCode,
                      name: product?.name,
                      productName: product?.name, // 상품명 추가
                      insuTerm: Array.isArray(product?.terms) 
                        ? product.terms[0]?.insuTerm ?? "—"
                        : product?.terms?.insuTerm ?? "—",
                      payTerm: Array.isArray(product?.terms) 
                        ? product.terms[0]?.payTerm ?? "—"
                        : product?.terms?.payTerm ?? "—",
                      ageRange: Array.isArray(product?.terms) 
                        ? product.terms[0]?.ageRange ?? "—"
                        : product?.terms?.ageRange ?? "—",
                      renew: Array.isArray(product?.terms) 
                        ? product.terms[0]?.renew ?? "—"
                        : product?.terms?.renew ?? "—"
                    })}
                    title="클릭하여 데이터 수정"
                  >
                    <div className="td code">{selectedMainCode ?? "—"}</div>
                    <div className="td name">{product?.name ?? "—"}</div>
                    <div className="td insu">
                      {Array.isArray(product?.terms) 
                        ? product.terms[0]?.insuTerm ?? "—"
                        : product?.terms?.insuTerm ?? "—"}
                    </div>
                    <div className="td pay">
                      {Array.isArray(product?.terms) 
                        ? product.terms[0]?.payTerm ?? "—"
                        : product?.terms?.payTerm ?? "—"}
                    </div>
                    <div className="td age">
                      {Array.isArray(product?.terms) 
                        ? product.terms[0]?.ageRange ?? "—"
                        : product?.terms?.ageRange ?? "—"}
                    </div>
                    <div className="td data">
                      {product
                        ? (product.calcAvailable ? "준비금키, 준비금, 보험료: Y" : "준비금키, 준비금, 보험료: N")
                        : "—"}
                    </div>
                    <div className="td min mono">
                      {limit?.manPremium ? prettyKR(limit.manPremium) : "—"}
                    </div>
                    <div className="td max mono">
                      {limit?.fmlPremium ? prettyKR(limit.fmlPremium) : "—"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3) 오류/도움말 박스 */}
          <div className="bottom-row">
            <div className="error-box">
              <div className="badge small">오류발생</div>
              <div className="msg">
                {(() => {
                  const allErrors = [...errorMessages];
                  
                  // productRows의 개별 오류 메시지도 추가
                  if (productRows.length > 0) {
                    productRows.forEach((row: any) => {
                      if (row.errorMessage) {
                        allErrors.push(`${row.insuCd}: ${row.errorMessage}`);
                      }
                    });
                  }
                  
                  return allErrors.length > 0 
                    ? allErrors.join('\n')
                    : (product?.message || limit?.message) ?? "도움말: 좌측에서 코드를 선택하세요. 산출 탭에서 계약금액(만원) 입력 후 계산을 누릅니다."
                })()}
              </div>
            </div>
            {/* 우측 여백은 도식과 동일하게 비워둠 */}
            <div />
          </div>
          
          {/* 4) 학습 통계 패널 */}
          <div className="learning-panel">
            <LearningStatisticsPanel />
          </div>
        </section>
      </main>
      
      {/* 모달: 파싱 결과 수정 화면 */}
      {showEditor && selectedRow && (
        <div className="modal-overlay">
          <ParsingResultEditor
            insuCd={selectedRow.insuCd || ""}
            originalResult={{
              insuCd: selectedRow.insuCd || "",
              productName: selectedRow.name,
              insuTerm: selectedRow.insuTerm,
              payTerm: selectedRow.payTerm,
              ageRange: selectedRow.ageRange,
              renew: selectedRow.renew
            }}
            pdfText="PDF 텍스트" // TODO: 실제 PDF 텍스트로 교체
            onSubmitSuccess={() => {
              setShowEditor(false);
              setSelectedRow(null);
              loadLearningStats(); // 통계 새로고침
            }}
            onCancel={() => {
              setShowEditor(false);
              setSelectedRow(null);
            }}
          />
        </div>
      )}
  </div>
)};

/** 숫자 → 한국어 축약(만/억) */
function prettyKR(v?: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "");
  if (n >= 100_000_000) {
    const eok = Math.floor(n / 100_000_000);
    const man = Math.floor((n % 100_000_000) / 10_000);
    return eok + "억" + (man ? ` ${man}만` : "");
  }
  if (n >= 10_000) return Math.floor(n / 10_000) + "만";
  return n.toLocaleString() + "원";
}
export default CalculatorComponent;
