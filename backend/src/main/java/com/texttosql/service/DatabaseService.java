package com.texttosql.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DatabaseService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Get the database schema information
     */
    public String getSchema() {
        StringBuilder schema = new StringBuilder();
        
        try {
            // Get all tables
            List<String> tables = jdbcTemplate.query(
                "SHOW TABLES",
                (rs, rowNum) -> rs.getString(1)
            );

            for (String table : tables) {
                schema.append("Table: ").append(table).append("\n");
                
                // Get columns for each table
                List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                    "DESCRIBE " + table
                );
                
                for (Map<String, Object> column : columns) {
                    schema.append("  - ")
                          .append(column.get("Field"))
                          .append(" (")
                          .append(column.get("Type"))
                          .append(")")
                          .append(column.get("Key") != null && column.get("Key").equals("PRI") ? " PRIMARY KEY" : "")
                          .append("\n");
                }
                schema.append("\n");
            }
            
            return schema.toString();
        } catch (Exception e) {
            return "Error fetching schema: " + e.getMessage();
        }
    }

    /**
     * Execute SQL query and return results
     */
    public List<Map<String, Object>> executeQuery(String sqlQuery) {
        try {
            return jdbcTemplate.query(sqlQuery, (rs, rowNum) -> {
                Map<String, Object> row = new HashMap<>();
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = metaData.getColumnName(i);
                    Object value = rs.getObject(i);
                    row.put(columnName, value);
                }
                
                return row;
            });
        } catch (Exception e) {
            throw new RuntimeException("Error executing query: " + e.getMessage(), e);
        }
    }
}
