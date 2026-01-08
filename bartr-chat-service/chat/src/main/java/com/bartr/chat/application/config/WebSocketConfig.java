package com.bartr.chat.application.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.*;
import com.bartr.common.feign.AuthTokenHolder;

@Configuration
@EnableWebSocketMessageBroker
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.setApplicationDestinationPrefixes("/app");
        config.enableSimpleBroker("/topic", "/queue");
        config.setUserDestinationPrefix("/user");
        config.setPreservePublishOrder(true);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register SockJS endpoint with specific allowed origins
        registry.addEndpoint("/ws")
               .setAllowedOrigins(
                   "http://localhost:5173",
                   "http://localhost:3000",
                   "http://localhost:5174",
                   "http://127.0.0.1:5173",
                   "http://127.0.0.1:3000"
               )
               .withSockJS()
               .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js")
               .setSessionCookieNeeded(false);

        // Register native WebSocket endpoint
        registry.addEndpoint("/ws")
               .setAllowedOrigins(
                   "http://localhost:5173",
                   "http://localhost:3000",
                   "http://localhost:5174",
                   "http://127.0.0.1:5173",
                   "http://127.0.0.1:3000"
               );
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(128 * 1024)
                   .setSendBufferSizeLimit(512 * 1024)
                   .setSendTimeLimit(20000);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null) {
                    StompCommand command = accessor.getCommand();
                    log.info("Received STOMP Command: {}", command);

                    if (StompCommand.CONNECT.equals(command)) {
                        String userId = accessor.getFirstNativeHeader("userId");
                        String authorization = accessor.getFirstNativeHeader("Authorization");
                        
                        log.info("WebSocket CONNECT - userId: {}, hasAuthorization: {}", userId, authorization != null);
                        if (authorization != null) {
                            log.info("Authorization header received (length: {})", authorization.length());
                        }
                        
                        if (userId != null) {
                            accessor.setUser(() -> userId);
                            log.info("User {} connected", userId);
                        }
                        
                        // Store the authorization token in session attributes for later use in Feign calls
                        if (authorization != null) {
                            String sessionId = accessor.getSessionId();
                            if (sessionId != null) {
                                // Store token in session attributes
                                var sessionAttrs = accessor.getSessionAttributes();
                                if (sessionAttrs != null) {
                                    sessionAttrs.put("authToken", authorization);
                                    log.info("Stored authorization token for session {} (token length: {})", sessionId, authorization.length());
                                } else {
                                    log.warn("Session attributes are null for session {}", sessionId);
                                }
                            } else {
                                log.warn("Session ID is null during CONNECT");
                            }
                        } else {
                            log.warn("No Authorization header received in WebSocket CONNECT");
                        }
                    } else if (StompCommand.DISCONNECT.equals(command)) {
                        String userId = accessor.getUser() != null ? accessor.getUser().getName() : "Unknown";
                        log.info("User {} disconnected", userId);
                        // Clean up token from session
                        accessor.getSessionAttributes().remove("authToken");
                    } else if (StompCommand.SEND.equals(command)) {
                        // For SEND commands, extract token from session and store in ThreadLocal
                        String sessionId = accessor.getSessionId();
                        log.info("WebSocket SEND command - sessionId: {}", sessionId);
                        if (sessionId != null) {
                            var sessionAttrs = accessor.getSessionAttributes();
                            if (sessionAttrs != null) {
                                Object authToken = sessionAttrs.get("authToken");
                                if (authToken != null) {
                                    // Store in ThreadLocal for Feign client to access
                                    String token = authToken.toString();
                                    AuthTokenHolder.setToken(token);
                                    log.info("Stored token in ThreadLocal for Feign client (token length: {})", token.length());
                                } else {
                                    log.warn("No authToken found in session attributes for session {}", sessionId);
                                }
                            } else {
                                log.warn("Session attributes are null for session {}", sessionId);
                            }
                        } else {
                            log.warn("Session ID is null during SEND");
                        }
                    }

                    log.debug("Message payload: {}", message.getPayload());
                    log.debug("Message headers: {}", message.getHeaders());
                }
                return message;
            }
        });
    }
}
