package com.bartr.chat.application.service;

import com.bartr.chat.domain.entities.Message;
import com.bartr.chat.domain.repositories.MessageRepository;
import com.bartr.common.core.exception.ErrorConstant;
import com.bartr.common.core.exception.ServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final MongoTemplate mongoTemplate;

    public Message saveMessage(Message message) {
        if (message == null) {
            log.error("Attempted to save null message");
            throw new ServiceException("40000001", "Message cannot be null", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        
        if (message.getSenderId() == null || message.getReceiverId() == null) {
            log.error("Message missing senderId or receiverId. senderId: {}, receiverId: {}", 
                message.getSenderId(), message.getReceiverId());
            throw new ServiceException("40000002", "Message must have both senderId and receiverId", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        
        if (message.getContent() == null || message.getContent().trim().isEmpty()) {
            log.error("Message has empty content");
            throw new ServiceException("40000003", "Message content cannot be empty", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        
        if (message.getTimestamp() == null) {
            message.setTimestamp(Instant.now());
            log.debug("Set timestamp to current time for message");
        }
        
        try {
            Message savedMessage = messageRepository.save(message);
            log.info("Message saved successfully. ID: {}, senderId: {}, receiverId: {}, content length: {}", 
                savedMessage.getId(), savedMessage.getSenderId(), savedMessage.getReceiverId(), 
                savedMessage.getContent() != null ? savedMessage.getContent().length() : 0);
            return savedMessage;
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error saving message to database: {}", e.getMessage(), e);
            throw new ServiceException("50000001", "Failed to save message: " + e.getMessage(), 
                    ErrorConstant.CATEGORY.TS, ErrorConstant.SEVERITY.C, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public List<Message> getChatHistory(String senderId, String receiverId) {
        if (senderId == null || receiverId == null || senderId.trim().isEmpty() || receiverId.trim().isEmpty()) {
            throw new ServiceException("40000004", "SenderId and receiverId cannot be null or empty", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        Sort sort = Sort.by(Sort.Direction.ASC, "timestamp");
        return messageRepository.findChatHistory(senderId, receiverId, sort);
    }

    /**
     * Get all unique conversation partners for a user
     * Returns a map of userId -> last message
     */
    public Map<String, Message> getAllConversations(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new ServiceException("40000005", "UserId cannot be null or empty", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        // Find all messages where user is either sender or receiver
        Criteria criteria = new Criteria().orOperator(
            Criteria.where("senderId").is(userId),
            Criteria.where("receiverId").is(userId)
        );

        // Get all messages sorted by timestamp descending
        List<Message> allMessages = mongoTemplate.find(
            org.springframework.data.mongodb.core.query.Query.query(criteria)
                .with(Sort.by(Sort.Direction.DESC, "timestamp")),
            Message.class
        );

        // Group by other user ID and keep only the latest message
        Map<String, Message> conversations = new LinkedHashMap<>();
        for (Message message : allMessages) {
            String otherUserId = message.getSenderId().equals(userId) 
                ? message.getReceiverId() 
                : message.getSenderId();
            
            // Only add if we haven't seen this conversation partner yet
            if (!conversations.containsKey(otherUserId)) {
                conversations.put(otherUserId, message);
            }
        }

        return conversations;
    }

    /**
     * Delete messages for conversations that started more than 3 days ago
     * Runs daily at 2 AM
     * 
     * Logic: For each conversation pair, find the first message timestamp.
     * If the first message is older than 3 days, delete all messages in that conversation.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void deleteOldMessages() {
        try {
            log.info("Starting scheduled task to delete messages from conversations older than 3 days");
            Instant threeDaysAgo = Instant.now().minusSeconds(3 * 24 * 60 * 60); // 3 days ago
            
            // Get all messages to find unique conversation pairs
            List<Message> allMessages = messageRepository.findAll();
            
            // Create a map to track conversation pairs and their first message timestamp
            // Key: "userId1|userId2" (sorted to handle bidirectional conversations)
            // Value: First message timestamp for this conversation
            Map<String, Instant> conversationStartTimes = new HashMap<>();
            Map<String, String[]> conversationPairs = new HashMap<>();
            
            for (Message message : allMessages) {
                String senderId = message.getSenderId();
                String receiverId = message.getReceiverId();
                
                // Skip system messages
                if ("system".equals(senderId) || "system".equals(receiverId)) {
                    continue;
                }
                
                // Create a consistent key for the conversation pair (sorted IDs)
                String[] pair = new String[]{senderId, receiverId};
                Arrays.sort(pair);
                String conversationKey = pair[0] + "|" + pair[1];
                
                // Track the earliest message timestamp for this conversation
                Instant messageTime = message.getTimestamp();
                if (!conversationStartTimes.containsKey(conversationKey) || 
                    messageTime.isBefore(conversationStartTimes.get(conversationKey))) {
                    conversationStartTimes.put(conversationKey, messageTime);
                    conversationPairs.put(conversationKey, pair);
                }
            }
            
            // Find conversations that started more than 3 days ago
            long totalDeleted = 0;
            for (Map.Entry<String, Instant> entry : conversationStartTimes.entrySet()) {
                Instant conversationStartTime = entry.getValue();
                
                if (conversationStartTime.isBefore(threeDaysAgo)) {
                    String[] pair = conversationPairs.get(entry.getKey());
                    String userId1 = pair[0];
                    String userId2 = pair[1];
                    
                    // Delete all messages for this conversation
                    Criteria criteria = new Criteria().orOperator(
                        new Criteria().andOperator(
                            Criteria.where("senderId").is(userId1),
                            Criteria.where("receiverId").is(userId2)
                        ),
                        new Criteria().andOperator(
                            Criteria.where("senderId").is(userId2),
                            Criteria.where("receiverId").is(userId1)
                        )
                    );
                    
                    Query query = new Query(criteria);
                    long deletedCount = mongoTemplate.remove(query, Message.class).getDeletedCount();
                    totalDeleted += deletedCount;
                    
                    log.info("Deleted {} messages for conversation between {} and {} (started: {})", 
                        deletedCount, userId1, userId2, conversationStartTime);
                }
            }
            
            log.info("Completed scheduled task. Total messages deleted: {} from conversations older than 3 days", totalDeleted);
        } catch (Exception e) {
            log.error("Error deleting old messages: {}", e.getMessage(), e);
        }
    }

    /**
     * Delete old messages for a specific conversation between two users
     */
    public void deleteOldMessagesForConversation(String userId1, String userId2) {
        if (userId1 == null || userId2 == null || userId1.trim().isEmpty() || userId2.trim().isEmpty()) {
            log.warn("Invalid userIds provided for deleteOldMessagesForConversation: userId1={}, userId2={}", userId1, userId2);
            return;
        }
        try {
            Instant oneWeekAgo = Instant.now().minusSeconds(7 * 24 * 60 * 60);
            
            Criteria criteria = new Criteria().andOperator(
                Criteria.where("timestamp").lt(oneWeekAgo),
                new Criteria().orOperator(
                    new Criteria().andOperator(
                        Criteria.where("senderId").is(userId1),
                        Criteria.where("receiverId").is(userId2)
                    ),
                    new Criteria().andOperator(
                        Criteria.where("senderId").is(userId2),
                        Criteria.where("receiverId").is(userId1)
                    )
                )
            );
            
            Query query = new Query(criteria);
            long deletedCount = mongoTemplate.remove(query, Message.class).getDeletedCount();
            log.info("Deleted {} old messages for conversation between {} and {}", deletedCount, userId1, userId2);
        } catch (Exception e) {
            log.error("Error deleting old messages for conversation: {}", e.getMessage(), e);
        }
    }
}
