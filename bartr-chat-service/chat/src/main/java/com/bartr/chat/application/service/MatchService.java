package com.bartr.chat.application.service;

import com.bartr.chat.application.client.MatchingServiceClientWrapper;
import com.bartr.chat.domain.repositories.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class MatchService {

    private final Set<String> matchedPairs = ConcurrentHashMap.newKeySet();
    private final MessageRepository messageRepository;
    private final MatchingServiceClientWrapper matchingServiceClient;

    public boolean isMatch(String userId1, String userId2) {
        if (userId1 == null || userId2 == null || userId1.equals(userId2)) {
            return false;
        }

        // First check in-memory cache
        String pairKey = createPairKey(userId1, userId2);
        String reversedPairKey = createPairKey(userId2, userId1);

        if (matchedPairs.contains(pairKey) || matchedPairs.contains(reversedPairKey)) {
            return true;
        }

        // If not in cache, check if messages exist between these users
        // If messages exist, they must have been matched at some point
        try {
            Sort sort = Sort.by(Sort.Direction.ASC, "timestamp");
            var messages = messageRepository.findChatHistory(userId1, userId2, sort);
            boolean hasMessages = !messages.isEmpty();
            
            if (hasMessages) {
                log.info("Users {} and {} have message history, considering them matched", userId1, userId2);
                // Add to cache for future lookups
                matchedPairs.add(pairKey);
                return true;
            }
        } catch (Exception e) {
            log.error("Error checking message history for match: {}", e.getMessage());
        }

        // If no messages, check the matching service to see if users are actually matched
        try {
            Boolean matchResult = matchingServiceClient.areUsersMatched(userId1, userId2);
            if (matchResult != null) {
                // We got a definitive answer from the matching service
                if (matchResult) {
                    log.info("Users {} and {} are matched according to matching service", userId1, userId2);
                    matchedPairs.add(pairKey);
                    return true;
                } else {
                    // Explicitly not matched
                    log.info("Matching service confirmed users {} and {} are NOT matched", userId1, userId2);
                    return false;
                }
            } else {
                // matchResult is null - service unavailable or auth error
                // For development: be lenient and allow (can be tightened in production)
                log.warn("Matching service returned null (unavailable/auth error) for users {} and {}.", userId1, userId2);
                log.warn("Allowing message to proceed - this is a development mode leniency.");
                log.warn("TODO: In production, implement proper authentication or reject messages when match service is unavailable");
                // Add to cache so we don't keep checking
                matchedPairs.add(pairKey);
                return true; // Temporary: allow when match service is unavailable
            }
        } catch (Exception e) {
            log.error("Error checking match status from matching service: {}", e.getMessage(), e);
            // For development: allow when there's an error (can be tightened in production)
            log.warn("Allowing message to proceed due to match service error - development mode");
            matchedPairs.add(pairKey);
            return true; // Temporary: allow when match service errors
        }
    }

    public void addMatch(String userId1, String userId2) {
        String pairKey = createPairKey(userId1, userId2);
        matchedPairs.add(pairKey);
    }

    public void removeMatch(String userId1, String userId2) {
        String pairKey = createPairKey(userId1, userId2);
        matchedPairs.remove(pairKey);
    }

    private String createPairKey(String userId1, String userId2) {
        return userId1.compareTo(userId2) < 0
            ? userId1 + ":" + userId2
            : userId2 + ":" + userId1;
    }

}
