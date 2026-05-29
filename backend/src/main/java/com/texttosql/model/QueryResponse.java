package com.texttosql.model;

import java.util.List;
import java.util.Map;

public class QueryResponse {
    private String sqlQuery;
    private List<Map<String, Object>> results;
    private String error;

    public QueryResponse() {
    }

    public QueryResponse(String sqlQuery, List<Map<String, Object>> results) {
        this.sqlQuery = sqlQuery;
        this.results = results;
    }

    public QueryResponse(String error, boolean isError) {
        this.error = error;
    }

    public String getSqlQuery() {
        return sqlQuery;
    }

    public void setSqlQuery(String sqlQuery) {
        this.sqlQuery = sqlQuery;
    }

    public List<Map<String, Object>> getResults() {
        return results;
    }

    public void setResults(List<Map<String, Object>> results) {
        this.results = results;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
