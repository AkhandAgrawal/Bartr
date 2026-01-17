package com.bartr.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Common Security Configuration for all services.
 * Configurable via application properties.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${security.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:3000}")
    private String allowedOrigins;

    @Value("${security.oauth2.jwk-set-uri:http://localhost:8081/realms/Bartr/protocol/openid-connect/certs}")
    private String jwkSetUri;

    @Value("${security.oauth2.login.default-success-url:/v1/user/profile}")
    private String defaultSuccessUrl;

    @Value("${security.oauth2.logout.success-url:http://localhost:8081/realms/Bartr/protocol/openid-connect/logout?redirect_uri=http://localhost:8080/}")
    private String logoutSuccessUrl;

    @Value("${security.permit-all-patterns:}")
    private String permitAllPatterns;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/").permitAll();
                    auth.requestMatchers(new RegexRequestMatcher(".*public.*", null)).permitAll();
                    auth.requestMatchers("/actuator/**").permitAll();
                    auth.requestMatchers("/error").permitAll();

                    // Allow services to configure additional permit-all patterns
                    if (permitAllPatterns != null && !permitAllPatterns.isEmpty()) {
                        String[] patterns = permitAllPatterns.split(",");
                        for (String pattern : patterns) {
                            pattern = pattern.trim();
                            if (!pattern.isEmpty()) {
                                auth.requestMatchers(pattern).permitAll();
                            }
                        }
                    }
                    
                    auth.anyRequest().authenticated();
                })
//                .oauth2Login(oauth2 -> oauth2
//                        .defaultSuccessUrl(defaultSuccessUrl, false)
//                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwkSetUri(jwkSetUri))
                        .authenticationEntryPoint(smartAuthenticationEntryPoint())
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(smartAuthenticationEntryPoint())
                )
                .logout(logout -> logout
                        .logoutSuccessUrl(logoutSuccessUrl)
                );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Parse allowed origins from comma-separated string
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins.stream().map(String::trim).toList());
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("*"));
        // Allow credentials (cookies, authorization headers) - needed for JWT tokens
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Smart authentication entry point that detects request type and responds appropriately.
     * For API requests: returns JSON 401
     * For browser requests: returns JSON 401 (avoiding login redirects)
     */
    @Bean
    public AuthenticationEntryPoint smartAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            String authHeader = request.getHeader("Authorization");
            boolean hasBearerToken = authHeader != null && authHeader.startsWith("Bearer ");
            boolean isApiRequest = isApiRequest(request);

            String errorMessage;
            if (hasBearerToken) {
                errorMessage = "Invalid or expired JWT token. Please refresh your token.";
            } else if (isApiRequest) {
                errorMessage = "Authentication required. Please provide a valid JWT token in the Authorization header.";
            } else {
                errorMessage = "Authentication required. Please login through the application.";
            }

            response.getWriter().write(
                String.format("{\"error\":\"Unauthorized\",\"message\":\"%s\",\"status\":401,\"timestamp\":\"%s\",\"path\":\"%s\"}",
                    errorMessage,
                    java.time.Instant.now().toString(),
                    request.getRequestURI())
            );
        };
    }

    /**
     * Determines if a request is an API request based on multiple factors.
     */
    private boolean isApiRequest(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String acceptHeader = request.getHeader("Accept");
        String authHeader = request.getHeader("Authorization");
        String userAgent = request.getHeader("User-Agent");
        String contentType = request.getHeader("Content-Type");

        // Check if request has Authorization header (likely API call)
        boolean hasBearerToken = authHeader != null && authHeader.startsWith("Bearer ");

        // Check if this is an API endpoint (matching service specific patterns)
        boolean isApiEndpoint = requestUri.startsWith("/v1/") ||
                               requestUri.startsWith("/api/") ||
                               requestUri.contains("/matches/") ||
                               requestUri.contains("/swipe") ||
                               requestUri.contains("/stats/") ||
                               requestUri.contains("/sync/");

        // Check Accept header - API calls usually accept JSON
        boolean acceptsJson = acceptHeader != null &&
            (acceptHeader.contains("application/json") ||
             acceptHeader.contains("*/*"));

        // Check Content-Type for POST/PUT requests
        boolean sendsJson = contentType != null && contentType.contains("application/json");

        // Check User-Agent for service calls (backend-to-backend communication)
        boolean isServiceCall = userAgent != null &&
            (userAgent.contains("Java") ||
             userAgent.contains("Apache-HttpClient") ||
             userAgent.contains("okhttp") ||
             userAgent.contains("RestTemplate") ||
             userAgent.contains("Feign") ||
             userAgent.contains("curl") ||
             userAgent.contains("Postman") ||
             userAgent.contains("Insomnia"));

        // It's an API request if any of these conditions are true
        return hasBearerToken || isApiEndpoint || (acceptsJson && !isBrowserRequest(request)) ||
               sendsJson || isServiceCall;
    }

    /**
     * Determines if a request is coming from a browser (not an API client).
     */
    private boolean isBrowserRequest(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        String acceptHeader = request.getHeader("Accept");

        // Browser requests typically have text/html in accept header and Mozilla user agent
        boolean hasBrowserUserAgent = userAgent != null && userAgent.contains("Mozilla");
        boolean acceptsHtml = acceptHeader != null && acceptHeader.contains("text/html");

        return hasBrowserUserAgent && acceptsHtml;
    }
}