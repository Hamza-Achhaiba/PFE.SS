package ma.smartsupply.service;

import ma.smartsupply.dto.ChatRequest;
import ma.smartsupply.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash-lite}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String SYSTEM_PROMPT = "You are Smart Supply Assistant, the AI assistant for the Smart Supply platform. " +
            "Your main role is to help users with Smart Supply topics such as navigation, orders, checkout, suppliers, products, messages, settings, and platform usage. " +
            "However, you are also allowed to answer general user questions outside Smart Supply, such as general knowledge, explanations, writing help, and casual questions. " +
            "If the user asks for private account-specific or real app data that you do not actually have access to, clearly say so and do not invent it. " +
            "Do not unnecessarily refuse normal questions. " +
            "Reply in the same language as the user when possible. " +
            "Keep answers clear, professional, and helpful.";

    @SuppressWarnings("unchecked")
    public ChatResponse processChat(ChatRequest request) {
        if (apiKey == null || apiKey.trim().isEmpty() || "null".equalsIgnoreCase(apiKey)) {
            return new ChatResponse("AI is currently disabled or unconfigured on this environment.", true);
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> part = new HashMap<>();
            String currentTimeContext = "Current server time: " + java.time.LocalDateTime.now().toString() + ". ";
            part.put("text", SYSTEM_PROMPT + "\n" + currentTimeContext + "\nUser: " + request.getMessage());

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));

            // Optional: You can configure generationConfig to avoid overly long answers or format issues
            // Map<String, Object> generationConfig = new HashMap<>();
            // generationConfig.put("maxOutputTokens", 500);
            // requestBody.put("generationConfig", generationConfig);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            Map<?, ?> response = restTemplate.postForObject(url, entity, Map.class);
            
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> resContent = (Map<String, Object>) candidate.get("content");
                    if (resContent != null && resContent.containsKey("parts")) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) resContent.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            String text = (String) parts.get(0).get("text");
                            return new ChatResponse(text, false);
                        }
                    }
                }
            }
            return new ChatResponse("I could not generate a response right now. Please try again later.", true);
        } catch (Exception e) {
            e.printStackTrace();
            return new ChatResponse("An error occurred while connecting to the AI service. Please try again later.", true);
        }
    }
}
