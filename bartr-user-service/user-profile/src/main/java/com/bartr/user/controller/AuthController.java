package com.bartr.user.controller;

import com.bartr.user.request.LoginRequest;
import com.bartr.user.response.LoginResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * Authentication Controller
 * Handles user login by calling Keycloak internally (Resource Owner Password Credentials flow).
 * The endpoint /v1/auth/login/public is accessible without authentication (matches .*public.* regex pattern).
 */
@RestController
@RequestMapping("/v1/auth")
@Slf4j
public class AuthController {

    @Value("${keycloak.serverUrl}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Login endpoint that accepts username/password and calls Keycloak internally.
     * Returns JWT tokens that can be used for subsequent API calls.
     *
     * @param request LoginRequest containing username and password
     * @return LoginResponse with access token, refresh token, and expiration info
     */
    @PostMapping("/login/public")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {

            // Build Keycloak token endpoint URL
            String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token",
                    keycloakServerUrl, realm);

            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // Build request body for Resource Owner Password Credentials flow
            StringBuilder body = new StringBuilder();
            body.append("grant_type=password&");
            body.append("client_id=").append(clientId).append("&");
            
            // Include client secret if configured (for confidential clients)
            if (clientSecret != null && !clientSecret.trim().isEmpty()) {
                body.append("client_secret=").append(clientSecret).append("&");
            }
            
            body.append("username=").append(request.getUsername()).append("&");
            body.append("password=").append(request.getPassword()).append("&");
            body.append("scope=openid profile email");

            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

            log.info("Attempting to authenticate user: {}", request.getUsername());

            // Call Keycloak token endpoint
            ResponseEntity<String> response = restTemplate.exchange(
                    tokenUrl, HttpMethod.POST, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Keycloak authentication failed for user: {} - Status: {}", 
                        request.getUsername(), response.getStatusCode());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(LoginResponse.builder()
                                .error("authentication_failed")
                                .errorDescription("Invalid username or password")
                                .build());
            }

            // Parse Keycloak response
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            
            String accessToken = jsonNode.has("access_token") ? 
                    jsonNode.get("access_token").asText() : null;
            String refreshToken = jsonNode.has("refresh_token") ? 
                    jsonNode.get("refresh_token").asText() : null;
            String tokenType = jsonNode.has("token_type") ? 
                    jsonNode.get("token_type").asText() : "Bearer";
            Long expiresIn = jsonNode.has("expires_in") ? 
                    jsonNode.get("expires_in").asLong() : null;

            if (accessToken == null) {
                log.error("Keycloak response missing access_token for user: {}", request.getUsername());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(LoginResponse.builder()
                                .error("token_missing")
                                .errorDescription("Keycloak did not return an access token")
                                .build());
            }

            log.info("Successfully authenticated user: {}", request.getUsername());

            // Return successful login response
            return ResponseEntity.ok(LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType(tokenType)
                    .expiresIn(expiresIn)
                    .build());

        } catch (HttpClientErrorException e) {
            // Handle Keycloak error responses
            log.warn("Keycloak authentication error for user: {} - Status: {}, Body: {}", 
                    request.getUsername(), e.getStatusCode(), e.getResponseBodyAsString());
            
            try {
                // Try to parse Keycloak error response
                if (e.getResponseBodyAsString() != null) {
                    JsonNode errorNode = objectMapper.readTree(e.getResponseBodyAsString());
                    String error = errorNode.has("error") ? 
                            errorNode.get("error").asText() : "authentication_failed";
                    String errorDescription = errorNode.has("error_description") ? 
                            errorNode.get("error_description").asText() : "Invalid username or password";
                    
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(LoginResponse.builder()
                                    .error(error)
                                    .errorDescription(errorDescription)
                                    .build());
                }
            } catch (Exception parseException) {
                log.error("Failed to parse Keycloak error response", parseException);
            }
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(LoginResponse.builder()
                            .error("authentication_failed")
                            .errorDescription("Invalid username or password")
                            .build());

        } catch (Exception e) {
            log.error("Unexpected error during authentication for user: {}", 
                    request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(LoginResponse.builder()
                            .error("internal_error")
                            .errorDescription("An unexpected error occurred during authentication")
                            .build());
        }
    }
}

