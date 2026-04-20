package com.example.SolveIt.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@Service
public class OcrService {

    @Value("${GEMINI_API_KEY}")
    private String apiKey;

    private final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=";

    public String processImageAndSolve(MultipartFile file) throws Exception {
        byte[] imageBytes = file.getBytes();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        // STRICTOR PROMPT: Removes all "tutor" language
        String prompt = "Analyze the image for mathematical expressions. " +
                "1. MATH ANALYSIS: If the input contains a math expression, solve it. For simple arithmetic (e.g., 5+2), solve it even if there is no '=' sign, provided the user's intent is to get an answer.\n" +
                "2. GENERAL TASKS: If the user provides a text-based instruction (e.g., \"write a table of 2\" or \"solve for x\"), fulfill that request.\n" +
                "3. OUTPUT FORMAT: Output ONLY a JSON object. Do not include words, explanations, or Markdown formatting."+
                "The JSON structure must be:\n" +
                "{\n" +
                "  \"eq\": \"(The expression or the user's request in LaTeX)\",\n" +
                "  \"steps\": [\"Step 1 of the process\", \"Step 2 of the process\"],\n" +
                "  \"ans\": \"(The final answer or result string)\"\n" +
                "}\n" +
                "\n" +
                "If the input is blank or unintelligible, return all fields as null.";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(
                                Map.of("text", prompt),
                                Map.of("inline_data", Map.of(
                                        "mime_type", "image/png",
                                        "data", base64Image
                                ))
                        )
                )),
                "generationConfig", Map.of("response_mime_type", "application/json")
        );

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL + apiKey, entity, Map.class);
            return extractJson(response.getBody());
        } catch (Exception e) {
            return "{\"error\": \"" + e.getMessage() + "\"}";
        }
    }

    private String extractJson(Map responseBody) {
        try {
            List candidates = (List) responseBody.get("candidates");
            Map content = (Map) ((Map) candidates.get(0)).get("content");
            List parts = (List) content.get("parts");
            return (String) ((Map) parts.get(0)).get("text");
        } catch (Exception e) {
            return "{\"error\": \"Parsing Error\"}";
        }
    }
}