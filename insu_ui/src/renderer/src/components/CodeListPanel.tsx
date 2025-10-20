import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";

type Props = {
  pickedCode: string | null;
  onPick: (code: string) => void;
  age: number;
};

export function CodeListPanel({ pickedCode, onPick, age }: Props) {
  const { codes, selectMainCode, loadProduct, loadLimit, checkDataAvailability, getMinMaxPremium, getContractTerms, getRelatedCodes, relatedCodes, selectedMainCode, setSelectedMainCode, calculatePremium } = useAppStore();

  // API 응답 구조에 맞게 주계약 필터링 
  // 백엔드에서 type=main으로 요청한 결과는 모두 주계약 코드
  const isMain = (c: any) =>
    (c.name && c.name.includes("주계약"));

  const main = useMemo(() => (codes ?? []).filter(isMain), [codes]);
  
  // 주계약이 선택된 경우 관련 코드만 표시, 그렇지 않으면 모든 특약 표시
  const riders = useMemo(() => {
    if (selectedMainCode && relatedCodes && relatedCodes.length > 0) {
      const relatedCodeList = relatedCodes.map((item: any) => item.insuCd);
      return (codes ?? []).filter(c => relatedCodeList.includes(c.insuCd));
    }
    
    if (relatedCodes.length > 0) {
      return relatedCodes;
    }
    
    return (codes ?? []).filter(c => !isMain(c));
  }, [codes, selectedMainCode, relatedCodes]);

  const pill = (cd: string, isMainContract: boolean = false) => (
    <button
      key={cd}
      className={`code-pill ${pickedCode === cd ? "picked" : ""}`}
      onClick={() => {
        onPick(cd);
        
        // 주계약인 경우 관련 코드들 조회
        if (isMainContract) {
          selectMainCode(cd);
          // selectedMainCode를 즉시 설정 (백엔드 API 호출 없이)
          setSelectedMainCode(cd);
          getRelatedCodes(cd); // 주계약별 관련 코드들 로드 (백엔드 API 호출)
        } else {
          // 특약인 경우 기존 방식 유지
          loadProduct(cd);
          loadLimit(cd, age);
          checkDataAvailability(cd, age); // 데이터 존재 여부 검증
          getMinMaxPremium(cd, age); // MIN/MAX 보험료 계산
          getContractTerms(cd); // 계약조건설명 로드
          
          // 보험료 계산 (기준금액 100으로)
          calculatePremium(cd, 100);
        }
      }}
    >
      {cd}
    </button>
  );

  return (
    <div className="code-wrap">
      <div className="code-row">
        {main.length ? main.map((c) => pill(c.insuCd, true)) : <span className="dim">주계약 코드 없음</span>}
      </div>
      <div className="code-row sub">
        {riders.length ? riders.map((c) => pill(c.insuCd, false)) : <span className="dim">특약 코드 없음</span>}
      </div>
    </div>
  );
}
