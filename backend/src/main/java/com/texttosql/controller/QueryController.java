package com.texttosql.controller;

import com.texttosql.model.QueryRequest;
import com.texttosql.model.QueryResponse;
import com.texttosql.service.DatabaseService;
import com.texttosql.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class QueryController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private DatabaseService databaseService;

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Text-to-SQL API is running");
        return ResponseEntity.ok(response);
    }

    /**
     * Get database schema
     */
    @GetMapping("/schema")
    public ResponseEntity<Map<String, String>> getSchema() {
        try {
            String schema = databaseService.getSchema();
            Map<String, String> response = new HashMap<>();
            response.put("schema", schema);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Generate SQL query from question
     */
    @PostMapping("/generate-sql")
    public ResponseEntity<Map<String, String>> generateSql(@RequestBody QueryRequest request) {
        try {
            String sqlQuery = geminiService.generateSqlQuery(request.getQuestion());
            Map<String, String> response = new HashMap<>();
            response.put("sqlQuery", sqlQuery);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Generate SQL and execute query
     */
    @PostMapping("/query")
    public ResponseEntity<QueryResponse> executeQuery(@RequestBody QueryRequest request) {
        try {
            // Step 1: Generate SQL query
            String sqlQuery = geminiService.generateSqlQuery(request.getQuestion());
            
            // Step 2: Execute the generated query
            List<Map<String, Object>> results = databaseService.executeQuery(sqlQuery);
            
            // Step 3: Return both SQL and results
            QueryResponse response = new QueryResponse(sqlQuery, results);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            QueryResponse error = new QueryResponse(e.getMessage(), true);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Execute a provided SQL query
     */
    @PostMapping("/execute-sql")
    public ResponseEntity<Map<String, Object>> executeSql(@RequestBody Map<String, String> request) {
        try {
            String sqlQuery = request.get("sqlQuery");
            List<Map<String, Object>> results = databaseService.executeQuery(sqlQuery);
            
            Map<String, Object> response = new HashMap<>();
            response.put("results", results);
            response.put("rowCount", results.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
