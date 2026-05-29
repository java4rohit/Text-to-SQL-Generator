package com.texttosql.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Autowired
    private DatabaseService databaseService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate SQL query from natural language question
     */
    public String generateSqlQuery(String question) {
        try {
            // Get database schema
            String schema = databaseService.getSchema();

            // Create the prompt template
            String prompt = String.format(
                "Based on the table schema below, write a SQL query that would answer the user's question:\n" +
                "Remember : Only provide me the sql query dont include anything else. Provide me sql query in a single line dont add line breaks\n" +
                "Table Schema: %s\n" +
                "Question: %s\n" +
                "SQL Query:",
                schema,
                question
            );

            // Prepare request body for Gemini API
            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, Object> content = new HashMap<>();
            Map<String, String> part = new HashMap<>();
            part.put("text", prompt);
            
            List<Map<String, String>> parts = new ArrayList<>();
            parts.add(part);
            content.put("parts", parts);
            
            List<Map<String, Object>> contents = new ArrayList<>();
            contents.add(content);
            requestBody.put("contents", contents);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-goog-api-key", apiKey);

            // Make API call to Gemini
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            // Parse response
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String sqlQuery = root
                    .path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
                
                // Clean up the SQL query
                sqlQuery = sqlQuery.trim()
                    .replace("```sql", "")
                    .replace("```", "")
                    .replace("\n", " ")
                    .trim();
                
                return sqlQuery;
            } else {
                throw new RuntimeException("Failed to generate SQL query from Gemini API");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error generating SQL: " + e.getMessage(), e);
        }
    }
}
