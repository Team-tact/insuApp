package com.example.insu.dto;

// OllamaResponse.java
// (Ollama가 반환하는 JSON에서 message 객체만 가져옵니다)
public record OllamaResponse(Message message) {}