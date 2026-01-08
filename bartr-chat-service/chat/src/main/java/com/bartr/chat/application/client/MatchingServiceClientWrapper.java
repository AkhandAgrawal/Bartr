package com.bartr.chat.application.client;

import com.bartr.chat.MatchingServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class MatchingServiceClientWrapper {
    
    private final MatchingServiceClient matchingServiceClient;
    
    /**
     * Check if two users are matched by querying the matching service
     * Returns null if the check cannot be performed (e.g., service unavailable, auth error)
     * Returns true if matched, false if not matched
     */
    public Boolean areUsersMatched(String userId1, String userId2) {
        log.info("Checking if users {} and {} are matched", userId1, userId2);
        
        // Check if token is available in ThreadLocal
        String token = com.bartr.common.feign.AuthTokenHolder.getToken();
        if (token != null) {
            log.info("Token available in ThreadLocal (length: {})", token.length());
        } else {
            log.warn("No token found in ThreadLocal - Feign client may not have authentication");
        }
        
        try {
            // Get match history for user1 using Feign client
            log.info("Calling matching service to get match history for user: {}", userId1);
            List<Map<String, Object>> matchHistory = matchingServiceClient.getMatchHistory(userId1);
            log.info("Match history response: {}", matchHistory != null ? matchHistory.size() + " matches" : "null");
            
            if (matchHistory != null && !matchHistory.isEmpty()) {
                // Check if userId2 is in the match history
                for (Map<String, Object> match : matchHistory) {
                    Object user1Id = match.get("user1Id");
                    Object user2Id = match.get("user2Id");
                    
                    log.debug("Checking match: user1Id={}, user2Id={}", user1Id, user2Id);
                    
                    if ((user1Id != null && user1Id.toString().equals(userId2)) ||
                        (user2Id != null && user2Id.toString().equals(userId2))) {
                        log.info("Users {} and {} are matched according to matching service", userId1, userId2);
                        return true;
                    }
                }
            }
            // No match found in history
            log.info("No match found between users {} and {}", userId1, userId2);
            return false;
        } catch (Exception e) {
            // If it's an authentication error (401) or service unavailable, return null to indicate unknown
            String errorMsg = e.getMessage();
            log.error("Exception checking match status: {}", e.getMessage(), e);
            
            if (errorMsg != null && (errorMsg.contains("401") || errorMsg.contains("Unauthorized"))) {
                log.warn("Authentication error (401) when checking match status. Token may not be forwarded correctly.");
                log.warn("Token in ThreadLocal: {}", token != null ? "present (length: " + token.length() + ")" : "null");
            } else {
                log.error("Error checking match status from matching service: {}", e.getMessage());
            }
            // Return null to indicate we couldn't determine match status
            return null;
        }
    }
}

