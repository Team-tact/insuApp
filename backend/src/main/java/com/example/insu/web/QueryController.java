package com.example.insu.web;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.insu.dto.ChatRequest;
import com.example.insu.dto.OllamaResponse;
import com.example.insu.service.OllamaService;
import com.example.insu.util.PdfParser;

import org.springframework.web.bind.annotation.RequestBody;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QueryController {

    private final OllamaService ollamaService;
    @Value("${insu.pdf-dir}")
    private String pdfDir;

    @PostMapping("/chat")
    public OllamaResponse handleChat(@RequestBody ChatRequest request) throws IOException {
        String messagePrefix = "'>상품1=데이터, >상품2=데이터 ..'으로 구분되는 문자열을 기반으로 대답하세요. 질문은 '> 질문=' 옆에 입력됩니다.";
        messagePrefix += "질문에 해당하는 자료가 없을 경우 '해당하는 데이터가 존재하지 않습니다.' 라고 대답하세요.";

        StringBuffer productData = new StringBuffer();

        Path dir = Paths.get(pdfDir);
        File[] files = dir.toFile().listFiles((d, name) -> 
            name.toLowerCase().endsWith(".pdf"));
        
        if (files != null) {
            for(int i=0; i< files.length; i++) {
                productData.append(">상품");
                productData.append(i);
                productData.append("=");
                productData.append(PdfParser.readAllText(files[i]));
            }
        }
        String finalPropt = messagePrefix + productData.toString() + ">질문=" + request.prompt();

        log.info("finalPropt :: {}", finalPropt);

        // 전체를 찍는 대신 길이를 찍어봅니다.
        log.info("finalPropt의 실제 길이 :: {} 글자", finalPropt.length()); 

        // 앞부분과 끝부분만 찍어서 확인합니다.
        log.info("finalPropt (앞 100자) :: {}", finalPropt.substring(0, 100));
        log.info("finalPropt (끝 100자) :: {}", finalPropt.substring(finalPropt.length() - 100));

        return ollamaService.getChatResponse(finalPropt);
    }

}
