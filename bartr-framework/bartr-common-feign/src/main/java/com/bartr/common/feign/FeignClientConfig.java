package com.bartr.common.feign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.RequestInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Common Feign client configuration for all services.
 * Supports both:
 * 1. ThreadLocal tokens (from WebSocket sessions) - checked first
 * 2. Service account tokens (from Keycloak) - fallback
 */
@Slf4j
public class FeignClientConfig {

    @Value("${keycloak.token-uri:}")
    private String tokenUri;

    @Value("${keycloak.client-id:}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    @Value("${keycloak.username:}")
    private String username;

    @Value("${keycloak.password:}")
    private String password;

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            // First, try to get token from ThreadLocal (set by WebSocket message processing)
            String token = AuthTokenHolder.getToken();
            
            log.debug("Feign client interceptor - Token in ThreadLocal: {}", token != null ? "present (length: " + token.length() + ")" : "null");
            log.debug("Feign client request URL: {}", requestTemplate.url());
            
            if (token != null && !token.isEmpty()) {
                // Use the token from WebSocket session
                // Token might already include "Bearer " prefix, so check
                String authHeader;
                if (token.startsWith("Bearer ")) {
                    authHeader = token;
                } else {
                    authHeader = "Bearer " + token;
                }
                requestTemplate.header("Authorization", authHeader);
                log.info("Using authentication token from WebSocket session for Feign client call to: {}", requestTemplate.url());
                return;
            }
            
            log.warn("No token in ThreadLocal, attempting to use service account token");
            
            // Fallback: Use service account token if keycloak is configured
            if (tokenUri != null && !tokenUri.isEmpty() && 
                clientId != null && !clientId.isEmpty()) {
                try {
                    String serviceToken = fetchToken();
                    requestTemplate.header("Authorization", "Bearer " + serviceToken);
                    log.info("Using service account token for Feign client call to: {}", requestTemplate.url());
                } catch (Exception e) {
                    log.warn("Failed to fetch service account token: {}", e.getMessage());
                    // Don't fail the request - some endpoints might not require auth
                }
            } else {
                log.warn("No authentication token available and service account not configured for request to: {}", requestTemplate.url());
            }
        };
    }

    private String fetchToken() {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        Map<String, String> params = new HashMap<>();
        params.put("grant_type", "password");
        params.put("client_id", clientId);
        params.put("client_secret", clientSecret);
        params.put("username", username);
        params.put("password", password);
        params.put("scope", "openid profile email");

        StringBuilder body = new StringBuilder();
        params.forEach((k, v) -> body.append(k).append("=").append(v).append("&"));
        String requestBody = body.substring(0, body.length() - 1);

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                tokenUri, HttpMethod.POST, entity, String.class);

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(response.getBody());
            return node.get("access_token").asText();
        } catch (Exception e) {
            log.error("Failed to fetch token: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch token", e);
        }
    }
}

