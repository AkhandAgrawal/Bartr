package com.bartr.common.security;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminConfig {
    @Value("${keycloak.serverUrl}")
    private String serverUrl;
    @Value("${keycloak.realm}")
    private String realm;
    @Value("${keycloak.client-id}")
    private String clientId;
    @Value("${keycloak.username}")
    private String username;
    @Value("${keycloak.password}")
    private String password;

    @Bean
    public Keycloak keycloakAdminClient(){
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("master")
                .username(username)
                .password(password)
                .clientId("admin-cli")
                .grantType(OAuth2Constants.PASSWORD)
                .build();
    }
}
