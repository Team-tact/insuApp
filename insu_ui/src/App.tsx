import { useEffect, useState } from "react";
import "./App.css";

// 스토어와 패널은 기존 그대로 사용

// 증분 학습 관련 컴포넌트 추가
import QueryComponent from "./components/QueryComponent";
import CalculatorComponent from "./components/CalculatorComponent";

export default function App() {
  // 현재 활성화된 탭을 관리하는 state. 'test'를 기본값으로 설정.
  const [activeTab, setActiveTab] = useState('test');
// activeTab state 값에 따라 적절한 컴포넌트를 반환하는 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case 'test':
        return <CalculatorComponent />;
      case 'query':
        return <QueryComponent />;
      default:
        return <CalculatorComponent />;
    }
  };
  return (
    <div className="app-container">
      {/* --- 3. 탭 버튼 네비게이션 --- */}
      <nav className="tab-navigation">
        <button
          // 클릭 시 activeTab state를 'test'로 변경
          onClick={() => setActiveTab('test')}
          // activeTab이 'test'일 경우 'active' 클래스 추가
          className={activeTab === 'test' ? 'active' : ''}
        >
          산출테스트
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={activeTab === 'query' ? 'active' : ''}
        >
          질의
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={activeTab === 'add' ? 'active' : ''}
        >
          추가
        </button>
      </nav>

      {/* --- 4. 선택된 탭의 컨텐츠 표시 --- */}
      <main className="tab-content">
        {renderTabContent()}
      </main>
    </div>
    
  );
}


