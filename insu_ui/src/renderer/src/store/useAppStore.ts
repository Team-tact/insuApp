import { create } from "zustand";
import type {
  PdfFile, CodeEntry, ProductInfoResponse, LimitInfo
} from "../types/dto";
import { httpGet } from "../api/client";


type Terms = {
  insuTerm?: string | null;     // 보험기간
  payTerm?: string | null;      // 납입기간
  ageRange?: string | null;     // "15~80" 같은 표현
  renew?: string | null;        // 갱신여부 등
  age?: { common?: string | null }; // App.tsx의 product?.terms?.age?.common 대응
};

type Product = {
  code: string;          // 선택한 주계약/특약 코드 (예: "21686")
  name: string;          // 상품명 (예: "(무)흥국생명 다(多)사랑암보험")
  terms?: Terms;         // 위의 기간/나이 요약
  calcAvailable?: boolean; // 준비금키/보험료 데이터 존재 여부 요약(Y/N)
  message?: string;      // 화면 하단 에러/도움말 메시지
};

type Limit = {
  minWon?: number | null;       // MIN(남/여) 환산값 중 표시용
  maxWon?: number | null;       // MAX(남/여) 환산값 중 표시용
  manPremium?: number | null;   // 남성 보험료
  fmlPremium?: number | null;   // 여성 보험료
  message?: string | null;      // 관련 메시지
};

// 다중 행 표시를 위한 새로운 타입
type ProductRow = {
  insuCd: string;
  name?: string;
  insuTerm?: string;
  payTerm?: string;
  ageRange?: string;
  type?: '주계약' | '특약';
  dataAvailable?: string; // "준비금기 Y/준비금 Y/보험료 Y" 형식
  minWon?: number | null; // MIN(남/여) 값
  maxWon?: number | null; // MAX(남/여) 값
  manPremium?: number | null; // 남성 보험료
  fmlPremium?: number | null; // 여성 보험료
  errorMessage?: string; // 개별 행의 오류 메시지
};

type State = {
  // 좌측 PDF
  pdfs: PdfFile[];
  pickPdf?: string;
  setPickPdf: (f?: string) => void;
  codes: CodeEntry[];

  // 다중 행 데이터
  productRows: ProductRow[];
  selectedMainCode?: string;

  // 오류 메시지 관리
  errorMessages: string[];
  addErrorMessage: (message: string) => void;
  clearErrorMessages: () => void;

  // 계약조건설명
  contractNotes: string[];

  // 관련 코드 필터링
  relatedCodes: CodeEntry[];
  
  // 학습 통계
  learningStats?: any;
  setLearningStats: (stats: any) => void;

  // 나이
  age: number;
  baseAmount: number;

  // 액션
  listPdfs(): Promise<void>;
  listCodes(file: string): Promise<void>;
  selectMainCode(mainCode: string): Promise<void>;
  loadProduct(insuCd: string): Promise<void>;
  loadLimit(insuCd: string, age?: number): Promise<void>;
  checkDataAvailability(insuCd: string, age?: number): Promise<void>;
  getMinMaxPremium(insuCd: string, age?: number): Promise<void>;
  getContractTerms(insuCd: string): Promise<void>;
  getRelatedCodes(mainCode: string): Promise<void>;
  setSelectedMainCode(mainCode: string): void;
  loadRowData(insuCd: string, age: number): Promise<void>;
  loadRowDataWithTerms(insuCd: string, age: number, insuTerm?: string, payTerm?: string): Promise<void>;
  calculatePremium(insuCd: string, baseAmount: number): Promise<void>;
  calculatePremiumWithTerms(insuCd: string, baseAmount: number, insuTerm?: string, payTerm?: string): Promise<void>;
  setAge(age: number): void;
  setBaseAmount(baseAmount: number): void;

  // ===== App.tsx가 요구하는 신규 필드 =====
  product?: Product;
  limit?: Limit;
};


export const useAppStore = create<State>((set, get) => ({
  pdfs: [],
  pickPdf: undefined,
  setPickPdf: (f?: string) => set({ pickPdf: f }),
  codes: [],
  productRows: [],
  selectedMainCode: undefined,
  errorMessages: [],
  addErrorMessage: (message: string) => {
    set(state => ({ 
      errorMessages: [...state.errorMessages, message]
    }));
  },
  clearErrorMessages: () => set({ errorMessages: [] }),
  contractNotes: [],
  relatedCodes: [],
  
  // 학습 통계
  learningStats: undefined,
  setLearningStats: (stats: any) => set({ learningStats: stats }),
  
  age: 15,
  baseAmount: 100,

  async listPdfs() {
    const list = await httpGet<PdfFile[]>("/api/pdf/list");
    set({ pdfs: list });
  },

  async listCodes(file: string) {
    console.log(`[DEBUG] ===== listCodes 시작 =====`);
    console.log(`[DEBUG] 선택된 파일: ${file}`);
    
    try {
      // PDF 클릭 즉시 선택 상태 반영 (좌측 하이라이트 + 상단 영역 동기화)
      console.log(`[DEBUG] 상태 초기화: pickPdf=${file}, productRows=[], selectedMainCode=undefined`);
      set({ pickPdf: file, productRows: [], selectedMainCode: undefined });

      // 현재는 주계약만 요청 (기존 기능 삭제 없음)
      const apiUrl = `/api/pdf/codes?file=${encodeURIComponent(file)}&type=main`;
      console.log(`[DEBUG] API 요청 URL: ${apiUrl}`);
      console.log(`[DEBUG] 주계약 코드 조회 API 호출 시작...`);
      
      const list = await httpGet<CodeEntry[]>(apiUrl);
      console.log(`[DEBUG] API 응답 받음:`, list);
      console.log(`[DEBUG] 조회된 코드 개수: ${list?.length || 0}`);
      console.log(`[DEBUG] 조회된 코드 목록:`, list?.map(code => `${code.insuCd}: ${code.name}`));
      
      set({ codes: list });
      console.log(`[DEBUG] 상태 업데이트 완료: codes 설정됨`);
      
      if (!list || list.length === 0) {
        console.warn(`[WARNING] 주계약 코드가 조회되지 않음. 파일: ${file}`);
        get().addErrorMessage(`주계약 코드 조회 실패: 파일 ${file}에서 코드를 찾을 수 없습니다.`);
      } else {
        console.log(`[INFO] 주계약 코드 ${list.length}개 조회 성공`);
      }
      
    } catch (error) {
      console.error(`[ERROR] listCodes 실패:`, error);
      get().addErrorMessage(`주계약 코드 조회 중 오류 발생: ${String(error)}`);
      set({ codes: [] });
    }
    
    console.log(`[DEBUG] ===== listCodes 완료 =====`);
  },

  async selectMainCode(mainCode: string) {
    console.log(`[DEBUG] ===== selectMainCode 시작 =====`);
    console.log(`[DEBUG] 선택된 주계약 코드: ${mainCode}`);
    
    console.log(`[DEBUG] 상태 초기화: selectedMainCode=${mainCode}, productRows=[], errorMessages=[]`);
    set({ selectedMainCode: mainCode, productRows: [], errorMessages: [] });
    
    try {
      console.log(`[DEBUG] 주계약 상품 정보 조회 API 호출 시작...`);
      const apiUrl = `/api/product/${mainCode}`;
      console.log(`[DEBUG] API 요청 URL: ${apiUrl}`);
      
      // 주계약 코드 선택 시 관련된 모든 코드들을 가져오는 API 호출
      const mainProduct = await httpGet<ProductInfoResponse>(apiUrl);
      console.log(`[DEBUG] 주계약 상품 정보 API 응답:`, mainProduct);
      
      // 주계약 정보를 먼저 추가 - 각 PolicyTerms 조합을 별도 행으로 생성
      const rows: ProductRow[] = [];
      
      if (mainProduct.terms && Array.isArray(mainProduct.terms)) {
        // 새로운 구조: 각 PolicyTerms 조합을 별도 행으로 생성
        console.log(`[DEBUG] 주계약 ${mainCode} terms 배열 길이:`, mainProduct.terms.length);
        console.log(`[DEBUG] 주계약 ${mainCode} terms 내용:`, mainProduct.terms);
        
        for (const term of mainProduct.terms) {
          rows.push({
            insuCd: mainCode,
            name: mainProduct.name || "상품명 없음",
            insuTerm: term.insuTerm || "—",
            payTerm: term.payTerm || "—",
            ageRange: term.ageRange || "—",
            type: '주계약'
          });
        }
      } else {
        // 기존 구조: 단일 PolicyTerms (호환성)
        rows.push({
          insuCd: mainCode,
          name: mainProduct.name || "상품명 없음",
          insuTerm: mainProduct.terms?.insuTerm || "—",
          payTerm: mainProduct.terms?.payTerm || "—",
          ageRange: mainProduct.terms?.ageRange || "—",
          type: '주계약'
        });
      }
      
      // 관련 특약 코드들 조회 (API 호출)
      console.log(`[DEBUG] 관련 특약 코드 조회 시작...`);
      const relatedCodeList: string[] = [];
      let relatedCodesData: any[] = [];
      
      try {
        const relatedApiUrl = `/api/product/${mainCode}/related-codes`;
        console.log(`[DEBUG] 관련 코드 API 요청 URL: ${relatedApiUrl}`);
        
        const relatedCodesResponse = await httpGet<any>(relatedApiUrl);
        console.log(`[DEBUG] 관련 코드 API 응답:`, relatedCodesResponse);
        
        if (relatedCodesResponse.relatedCodes && Array.isArray(relatedCodesResponse.relatedCodes)) {
          relatedCodesData = relatedCodesResponse.relatedCodes;
          relatedCodeList.push(...relatedCodesData.map((item: any) => item.insuCd));
          console.log(`[DEBUG] 조회된 관련 코드 개수: ${relatedCodeList.length}`);
          console.log(`[DEBUG] 관련 코드 목록:`, relatedCodeList);
        } else {
          console.warn(`[WARNING] 관련 코드 응답에 relatedCodes 배열이 없음:`, relatedCodesResponse);
        }
      } catch (e) {
        console.error(`[ERROR] 관련 코드 조회 실패 (${mainCode}):`, e);
        set(state => ({
          errorMessages: [...state.errorMessages, `관련 코드 조회 실패: ${String(e)}`]
        }));
      }
      
      // 각 관련 코드에 대해 상세 정보 조회
      for (const relatedCode of relatedCodeList) {
        try {
          const relatedProduct = await httpGet<ProductInfoResponse>(`/api/product/${relatedCode}`);
          
          if (relatedProduct.terms && Array.isArray(relatedProduct.terms)) {
            // 새로운 구조: 각 PolicyTerms 조합을 별도 행으로 생성
            for (const term of relatedProduct.terms) {
              rows.push({
                insuCd: relatedCode,
                name: relatedProduct.name || "상품명 없음",
                insuTerm: term.insuTerm || "—",
                payTerm: term.payTerm || "—",
                ageRange: term.ageRange || "—",
                type: '특약'
              });
            }
          } else {
            // 기존 구조: 단일 PolicyTerms (호환성)
            rows.push({
              insuCd: relatedCode,
              name: relatedProduct.name || "상품명 없음",
              insuTerm: relatedProduct.terms?.insuTerm || "—",
              payTerm: relatedProduct.terms?.payTerm || "—",
              ageRange: relatedProduct.terms?.ageRange || "—",
              type: '특약'
            });
          }
        } catch (e) {
          console.warn(`특약 코드 ${relatedCode} 조회 실패:`, e);
          // 실패해도 기본 정보로 추가 (단일 행)
          rows.push({
            insuCd: relatedCode,
            name: "상품명 없음",
            insuTerm: "—",
            payTerm: "—",
            ageRange: "—",
            type: '특약'
          });
        }
      }
      
      console.log(`[DEBUG] 총 ${rows.length} 개의 행 생성됨`);
      console.log(`[DEBUG] 생성된 행 목록:`, rows.map(row => `${row.insuCd}(${row.type}): ${row.name}`));
      
      set({ 
        productRows: rows,
        relatedCodes: relatedCodesData
      });
      console.log(`[DEBUG] 상태 업데이트 완료: productRows=${rows.length}개, relatedCodes=${relatedCodesData.length}개`);
      
      console.log(`[DEBUG] 각 행에 대한 데이터 로드 시작...`);
      // 각 행에 대한 데이터 로드 (현재 나이 기준)
      const currentAge = get().age;
      console.log(`[DEBUG] 현재 나이: ${currentAge}`);
      
      for (const row of rows) {
        console.log(`[DEBUG] 행 데이터 로드: ${row.insuCd} (${row.type})`);
        get().loadRowDataWithTerms(row.insuCd, currentAge, row.insuTerm, row.payTerm);
      }
      
      console.log(`[INFO] 주계약 ${mainCode} 선택 완료: 총 ${rows.length}개 행 처리`);
      
    } catch (e) {
      console.error(`[ERROR] 주계약 코드 선택 실패:`, e);
      console.error(`[ERROR] 오류 상세:`, {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        mainCode: mainCode
      });
      get().addErrorMessage(`주계약 ${mainCode} 선택 실패: ${String(e)}`);
      set({ productRows: [] });
    }
    
    console.log(`[DEBUG] ===== selectMainCode 완료 =====`);
  },

  async loadProduct(insuCd: string) {
    try {
      const p = await httpGet<ProductInfoResponse>(`/api/product/${insuCd}`);
      const product: Product = {
        code: p.insuCd,
        name: p.name || "상품명 없음",
        terms: p.terms || undefined,
        calcAvailable: p.calcAvailable || false,
        message: p.message || undefined
      };
      set({ product });
    } catch (e) {
      console.error(`상품 정보 로드 실패: ${insuCd}`, e);
      set({ 
        product: {
          code: insuCd,
          name: "오류",
          message: `상품 정보 로드 실패: ${String(e)}`
        }
      });
    }
  },

  async loadLimit(insuCd: string, age?: number) {
    try {
      const q = age != null ? `?age=${age}` : "";
      const lim = await httpGet<LimitInfo>(`/api/limit/${insuCd}${q}`);
      const limit: Limit = {
        minWon: lim.minWon,
        maxWon: lim.maxWon,
        message: lim.message
      };
      set({ limit });
    } catch (e) {
      set({ 
        limit: {
          message: `한도 정보 로드 실패: ${String(e)}`
        }
      });
    }
  },

  async checkDataAvailability(insuCd: string, age?: number) {
    try {
      const q = age != null ? `?age=${age}` : "";
      const result = await httpGet<any>(`/api/data/check/${insuCd}${q}`);
      
      // 오류 메시지를 스토어에 추가
      const errors = result.errors || [];
      errors.forEach((error: string) => {
        get().addErrorMessage(`${insuCd}: ${error}`);
      });
      
    } catch (e) {
      console.error(`데이터 검증 API 호출 실패: ${insuCd}`, e);
      get().addErrorMessage(`데이터 검증 실패: ${String(e)}`);
    }
  },

  async getMinMaxPremium(insuCd: string, age?: number) {
    try {
      const q = age != null ? `?age=${age}` : "";
      const result = await httpGet<any>(`/api/premium/minmax/${insuCd}${q}`);
      
      // 오류 메시지를 스토어에 추가
      const errors = result.errors || [];
      errors.forEach((error: string) => {
        get().addErrorMessage(`${insuCd}: ${error}`);
      });
      
      // MIN/MAX 정보를 limit에 저장 (간단 버전)
      if (!errors.length && result.manMin && result.manMax) {
        set(state => ({
          limit: {
            ...state.limit,
            minWon: result.manMin,
            maxWon: result.manMax,
            message: `MIN: ${result.manMin}원, MAX: ${result.manMax}원`
          }
        }));
      }
      
    } catch (e) {
      get().addErrorMessage(`MIN/MAX 보험료 계산 실패: ${String(e)}`);
    }
  },

  async getContractTerms(insuCd: string) {
    try {
      const result = await httpGet<any>(`/api/contract/terms/${insuCd}`);
      
      // 계약조건 노트를 스토어에 저장
      const notes = result.notes || [];
      set({ contractNotes: notes });
      
    } catch (e) {
      get().addErrorMessage(`계약조건설명 로드 실패: ${String(e)}`);
    }
  },

  async getRelatedCodes(mainCode: string) {
    try {
      const result = await httpGet<any>(`/api/product/${mainCode}/related-codes`);
      
      // 관련 코드들을 스토어에 저장
      const relatedCodes = result.relatedCodes || [];
      set({ 
        relatedCodes: relatedCodes,
        selectedMainCode: mainCode
      });
      
    } catch (e) {
      get().addErrorMessage(`관련 코드 조회 실패: ${String(e)}`);
    }
  },

  setSelectedMainCode(mainCode: string) {
    set({ selectedMainCode: mainCode });
  },

  setAge(age: number) {
    set({ age });
    
    // 현재 productRows가 있다면 모든 행의 데이터를 새 나이로 다시 로드
    const currentRows = get().productRows;
    if (currentRows.length > 0) {
      for (const row of currentRows) {
        get().loadRowDataWithTerms(row.insuCd, age, row.insuTerm, row.payTerm);
      }
    }
  },

  setBaseAmount(baseAmount: number) {
    set({ baseAmount });
    
    // 현재 productRows가 있다면 모든 행의 보험료를 새 기준금액으로 다시 계산
    const currentRows = get().productRows;
    if (currentRows.length > 0) {
      for (const row of currentRows) {
        get().calculatePremiumWithTerms(row.insuCd, baseAmount, row.insuTerm, row.payTerm);
      }
    }
  },

  async loadRowData(insuCd: string, age: number, payTerm?: string) {
    try {
      // 납입기간 정보를 백엔드에 전달
      const payTermParam = payTerm ? `&payTerm=${payTerm}` : '';
      
      // 데이터 존재 유무 확인
      const dataCheck = await httpGet<any>(`/api/data/check/${insuCd}?age=${age}${payTermParam}`);

      // MIN/MAX 보험료 조회
      const minMaxResult = await httpGet<any>(`/api/premium/minmax/${insuCd}?age=${age}${payTermParam}`);

      // 데이터 존재 유무 문자열 생성
      let dataAvailable = "준비금키 N/준비금 N/보험료 N";
      if (dataCheck.rsvKey || dataCheck.rsvRate || dataCheck.premRate) {
        const rsvKey = dataCheck.rsvKey === "Y";
        const rsvRate = dataCheck.rsvRate === "Y";
        const premRate = dataCheck.premRate === "Y";
        dataAvailable = `준비금키 ${rsvKey ? 'Y' : 'N'}/준비금 ${rsvRate ? 'Y' : 'N'}/보험료 ${premRate ? 'Y' : 'N'}`;
      }

      // MIN/MAX 값 설정
      const minWon = minMaxResult.manMin || null;
      const maxWon = minMaxResult.manMax || null;

      // 오류 메시지 수집
      const errors = [];
      if (dataCheck.errors) errors.push(...dataCheck.errors);
      if (minMaxResult.errors) errors.push(...minMaxResult.errors);
      const errorMessage = errors.length > 0 ? errors.join(', ') : undefined;

      // productRows 업데이트
      set(state => ({
        productRows: state.productRows.map(row =>
          row.insuCd === insuCd
            ? {
                ...row,
                dataAvailable,
                minWon,
                maxWon,
                errorMessage
              }
            : row
        )
      }));

    } catch (e) {
      console.error(`행 데이터 로드 실패 (${insuCd}):`, e);

      // 백엔드 연결 상태에 따른 오류 메시지 구분
      let errorMessage = "데이터 조회 실패";
      if (String(e).includes("fetch")) {
        errorMessage = "백엔드 서버 연결 실패";
      } else if (String(e).includes("500")) {
        errorMessage = "서버 내부 오류";
      } else {
        errorMessage = `데이터 조회 실패: ${String(e)}`;
      }

      // 오류 시에도 기본값으로 업데이트
      set(state => ({
        productRows: state.productRows.map(row =>
          row.insuCd === insuCd
            ? {
                ...row,
                dataAvailable: "백엔드 연결 실패",
                minWon: null,
                maxWon: null,
                errorMessage
              }
            : row
        )
      }));
    }
  },

  async loadRowDataWithTerms(insuCd: string, age: number, insuTerm?: string, payTerm?: string) {
    try {
      // 새로운 API를 사용하여 조합별 데이터 로드
      const params = new URLSearchParams({
        age: age.toString(),
        insuTerm: insuTerm || "—",
        payTerm: payTerm || "—"
      });
      
      // 데이터 존재 유무 확인
      const dataCheck = await httpGet<any>(`/api/data/check/${insuCd}?${params}`);

      // 조합별 보험료 계산
      const premiumResult = await httpGet<any>(`/api/premium/calculate-by-terms/${insuCd}?${params}&baseAmount=100`);

      // 데이터 존재 유무 문자열 생성
      let dataAvailable = "준비금키 N/준비금 N/보험료 N";
      if (dataCheck.rsvKey || dataCheck.rsvRate || dataCheck.premRate) {
        const rsvKey = dataCheck.rsvKey === "Y";
        const rsvRate = dataCheck.rsvRate === "Y";
        const premRate = dataCheck.premRate === "Y";
        dataAvailable = `준비금키 ${rsvKey ? 'Y' : 'N'}/준비금 ${rsvRate ? 'Y' : 'N'}/보험료 ${premRate ? 'Y' : 'N'}`;
      }

      // 보험료 값 설정
      const manPremium = premiumResult.manPremium || null;
      const fmlPremium = premiumResult.fmlPremium || null;

      // 오류 메시지 수집
      const errors = [];
      if (dataCheck.errors) errors.push(...dataCheck.errors);
      if (premiumResult.errors) errors.push(...premiumResult.errors);
      const errorMessage = errors.length > 0 ? errors.join(', ') : undefined;

      // productRows 업데이트 - insuCd, insuTerm, payTerm가 모두 일치하는 행만 업데이트
      set(state => ({
        productRows: state.productRows.map(row =>
          row.insuCd === insuCd && row.insuTerm === insuTerm && row.payTerm === payTerm
            ? {
                ...row,
                dataAvailable,
                manPremium,
                fmlPremium,
                errorMessage
              }
            : row
        )
      }));

    } catch (e) {
      console.error(`행 데이터 로드 실패 (${insuCd}):`, e);

      // 백엔드 연결 상태에 따른 오류 메시지 구분
      let errorMessage = "데이터 조회 실패";
      if (String(e).includes("fetch")) {
        errorMessage = "백엔드 서버 연결 실패";
      } else if (String(e).includes("500")) {
        errorMessage = "서버 내부 오류";
      } else {
        errorMessage = `데이터 조회 실패: ${String(e)}`;
      }

      // 오류 시에도 기본값으로 업데이트
      set(state => ({
        productRows: state.productRows.map(row =>
          row.insuCd === insuCd && row.insuTerm === insuTerm && row.payTerm === payTerm
            ? {
                ...row,
                dataAvailable: "백엔드 연결 실패",
                manPremium: null,
                fmlPremium: null,
                errorMessage
              }
            : row
        )
      }));
    }
  },

  async calculatePremiumWithTerms(insuCd: string, baseAmount: number, insuTerm?: string, payTerm?: string) {
    try {
      // 새로운 API를 사용하여 조합별 보험료 계산
      const params = new URLSearchParams({
        age: get().age.toString(),
        insuTerm: insuTerm || "—",
        payTerm: payTerm || "—",
        baseAmount: baseAmount.toString()
      });
      
      const result = await httpGet<any>(`/api/premium/calculate-by-terms/${insuCd}?${params}`);
      
      const manPremium = result.manPremium || null;
      const fmlPremium = result.fmlPremium || null;
      
      console.log(`보험료 계산: ${insuCd}, 조합(${insuTerm}, ${payTerm}), 기준금액: ${baseAmount}, 남성: ${manPremium}, 여성: ${fmlPremium}`);
      
      // productRows 업데이트 - insuCd, insuTerm, payTerm가 모두 일치하는 행만 업데이트
      set(state => ({
        productRows: state.productRows.map(row =>
          row.insuCd === insuCd && row.insuTerm === insuTerm && row.payTerm === payTerm
            ? {
                ...row,
                manPremium: manPremium,
                fmlPremium: fmlPremium
              }
            : row
        )
      }));
      
      // 오류 메시지 처리
      if (result.errors && result.errors.length > 0) {
        get().addErrorMessage(`${insuCd}(${insuTerm}, ${payTerm}): ${result.errors.join(', ')}`);
      }
      
    } catch (e) {
      console.error(`보험료 계산 실패 (${insuCd}):`, e);
      get().addErrorMessage(`보험료 계산 실패: ${String(e)}`);
    }
  },

  async calculatePremium(insuCd: string, baseAmount: number) {
    try {
      // 임시로 모의 데이터를 사용하여 보험료 계산
      // 실제로는 백엔드 API를 호출해야 함
      const mockManRate = 0.001; // 남성 요율 (예시)
      const mockFmlRate = 0.0008; // 여성 요율 (예시)
      const mockStndAmt = 1000000; // 기준구성금액 (예시)
      
      // 보험료 계산: (기준금액 * 요율 / 기준구성금액) * 10000
      const manPremium = Math.round((baseAmount * mockManRate / mockStndAmt) * 10000);
      const fmlPremium = Math.round((baseAmount * mockFmlRate / mockStndAmt) * 10000);
      
      console.log(`보험료 계산: ${insuCd}, 기준금액: ${baseAmount}, 남성: ${manPremium}, 여성: ${fmlPremium}`);
      
      // productRows 업데이트
      set(state => ({
        productRows: state.productRows.map(row =>
          row.insuCd === insuCd
            ? {
                ...row,
                manPremium: manPremium,
                fmlPremium: fmlPremium
              }
            : row
        )
      }));
      
      // productRows가 비어있는 경우 limit에도 저장
      set(state => ({
        limit: {
          ...state.limit,
          manPremium: manPremium,
          fmlPremium: fmlPremium
        }
      }));
      
    } catch (e) {
      console.error(`보험료 계산 실패 (${insuCd}):`, e);
      get().addErrorMessage(`보험료 계산 실패: ${String(e)}`);
    }
  },
}));
