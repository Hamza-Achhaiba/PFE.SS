package ma.smartsupply.service;

import ma.smartsupply.dto.ChatRequest;
import ma.smartsupply.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiChatService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash-lite}")
    private String modelName;

    private static final String SYSTEM_PROMPT = 
        "You are the Smart Supply Assistant, a helpful and professional chatbot for the Smart Supply B2B marketplace platform connecting small stores/clients with suppliers. " +
        "Your primary role is to help users navigate the app, understand orders, checkout, suppliers, products, messages, profiles, and settings. " +
        "Provide short, helpful, professional, and clear answers. Do not pretend to perform backend actions or invent features/private data. " +
        "If asked for account-specific data not provided here, politely clarify you cannot access it directly. " +
        "You MUST ALSO answer general knowledge questions normally. Do not refuse out-of-domain questions. Just answer them clearly and concisely. " +
        "Always answer in the same language as the user's message.";

    public ChatResponse processChat(ChatRequest request) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return new ChatResponse("Configuration error: API Key is missing. The backend must be configured correctly.", true, "Missing API Key");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construct payload
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", request.getMessage());
            
            Map<String, Object> contentPart = new HashMap<>();
            contentPart.put("parts", Collections.singletonList(textPart));

            Map<String, Object> systemInstructionTextPart = new HashMap<>();
            systemInstructionTextPart.put("text", SYSTEM_PROMPT);
            
            Map<String, Object> systemInstructionPart = new HashMap<>();
            systemInstructionPart.put("parts", Collections.singletonList(systemInstructionTextPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contentPart));
            requestBody.put("system_instruction", systemInstructionPart);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, entity, Map.class);

            
            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> responseBody = responseEntity.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                    if (content != null) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            String textResponse = (String) parts.get(0).get("text");
                            return new ChatResponse(textResponse);
                        }
                    }
                }
            }
            
            return new ChatResponse("Could not generate a response at this time. Please try again later.", true, "Invalid API Response structure");
            
        } catch (Exception e) {
            e.printStackTrace();
            return new ChatResponse("An error occurred while connecting to the AI service. Please try again later.", true, e.getMessage());
        }
    }
}
