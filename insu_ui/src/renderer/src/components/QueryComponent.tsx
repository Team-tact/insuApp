import React, { useState, useEffect, useRef } from 'react';
import './QueryComponent.css'; // 스타일을 위한 CSS 파일
import ReactMarkdown from 'react-markdown';

const QueryInterface = () => {
    // 메시지 목록을 관리하는 state
    const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: '안녕하세요! 무엇이 궁금하신가요?' }
    ]);
    // 사용자 입력을 관리하는 state
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // 스크롤을 맨 아래로 내리기 위한 ref
    const messageListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages, isLoading]); // isLoading이 변경될 때도 스크롤 맨 아래로

    const handleSubmit = async (e: { preventDefault: () => void; }) => { // 1. async 추가
        e.preventDefault();
  
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return; // 로딩 중일 때는 전송 방지
        if (!trimmedInput) return;

        const newUserMessage = {
            id: Date.now(),
            sender: 'user',
            text: trimmedInput,
        };

        // 2. 메시지 목록에 사용자 메시지 *먼저* 추가
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setInput('');

        // --- 1. (디버깅 추가) fetch 직전에 내가 보내는 값을 확인 ---
        const requestBody = {
            prompt: trimmedInput
        };
        console.log("백엔드로 전송할 데이터:", JSON.stringify(requestBody));
        // --- 여기까지 ---

        // --- 2. API 요청 직전에 로딩 상태를 true로 변경 ---
        setIsLoading(true);

        // 3. (변경) AI 응답을 위해 fetch 사용
        try {
            const response = await fetch("http://localhost:8081/api/chat", {
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                    },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                throw new Error('Ollama 서버에서 오류가 발생했습니다.');
            }

            const data = await response.json();

            // --- 3. AI 응답이 오면 로딩 상태를 false로 변경 ---
            setIsLoading(false);

            // 5. AI 응답 메시지를 state에 추가
            const aiResponse = {
                id: Date.now() + 1,
                sender: 'ai',
                text: data.message.content, // AI가 보낸 텍스트
            };
            setMessages((prevMessages) => [...prevMessages, aiResponse]);

        } catch (error) {
            // 6. 오류 처리
            // --- 4. 오류 발생 시에도 로딩 상태를 false로 변경 ---
            setIsLoading(false);

            console.error("Fetch 오류:", error);
            const errorResponse = {
                id: Date.now() + 1,
                sender: 'ai',
                text: `오류가 발생했습니다: ${error}`,
            };
            setMessages((prevMessages) => [...prevMessages, errorResponse]);
        }
    };

  return (
    <div className="chat-container">
      {/* 1. 메시지 목록 */}
      <div className="message-list" ref={messageListRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.sender}`}>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}

        {/* --- 5. isLoading이 true일 때 로딩 메시지 표시 --- */}
        {isLoading && (
          <div className="message-bubble ai loading">
            데이터를 확인중입니다...
          </div>
        )}

      </div>

      {/* 2. 질의 입력 폼 */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          value={input}
        onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 질의를 입력하세요..."
          disabled={isLoading} // 로딩 중일 때 입력창 비활성화
        />
 <button type="submit" className="send-button" disabled={isLoading}>
          {isLoading ? '전송중...' : '전송'}
        </button>
      </form>
    </div>
  );
};

export default QueryInterface;