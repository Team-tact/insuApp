package com.example.insu.dto;

// OllamaRequest.java
// 'stream: false'가 중요합니다. (true로 하면 응답 방식이 복잡해집니다)
public record OllamaRequest(
    String model, 
    java.util.List<Message> messages, 
    boolean stream
) {
    public OllamaRequest(String model, String prompt) {
        this(model, java.util.List.of(new Message("user", prompt)), false);
    }
}
