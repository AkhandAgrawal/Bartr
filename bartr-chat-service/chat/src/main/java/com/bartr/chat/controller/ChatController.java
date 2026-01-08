package com.bartr.chat.controller;

import com.bartr.chat.UserServiceClient;
import com.bartr.common.feign.AuthTokenHolder;
import com.bartr.chat.application.service.MessageService;
import com.bartr.chat.application.service.MatchService;
import com.bartr.chat.application.utility.EventProducerUtility;
import com.bartr.chat.domain.entities.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final MessageService messageService;
    private final MatchService matchService;
    private final SimpMessagingTemplate messagingTemplate;
    private final EventProducerUtility eventProducerUtility;
    private final UserServiceClient userServiceClient;

    @MessageMapping("/private-message")
    public void sendPrivateMessage(@Payload Message message) {
        if (message == null) {
            log.error("Received null message in WebSocket handler! Possible deserialization issue.");
            return;
        }

        log.info("Received message from {} to {}", message.getSenderId(), message.getReceiverId());

        // Check if there are existing messages between these users FIRST
        // This is the most reliable check and doesn't depend on external services
        boolean hasExistingMessages = false;
        try {
            var existingMessages = messageService.getChatHistory(message.getSenderId(), message.getReceiverId());
            hasExistingMessages = !existingMessages.isEmpty();
            log.info("Existing messages check: {} messages found between {} and {}", existingMessages.size(), message.getSenderId(), message.getReceiverId());
        } catch (Exception e) {
            log.error("Error checking existing messages: {}", e.getMessage(), e);
        }

        // If they have existing messages, allow them to continue chatting
        boolean isMatched = false;
        if (hasExistingMessages) {
            log.info("Users have existing message history. Allowing message to proceed.");
        } else {
            // Only check match service if there are no existing messages
            isMatched = matchService.isMatch(message.getSenderId(), message.getReceiverId());
            log.info("Match check result: isMatched={} for users {} and {}", isMatched, message.getSenderId(), message.getReceiverId());
            
            if (!isMatched) {
                log.warn("Users {} and {} are not matched and have no message history. Message rejected.", 
                    message.getSenderId(), message.getReceiverId());

                Message errorMessage = new Message();
                errorMessage.setSenderId("system");
                errorMessage.setReceiverId(message.getSenderId());
                errorMessage.setContent("You can only chat with matched users.");

                messagingTemplate.convertAndSend(
                    "/queue/messages/" + message.getSenderId(),
                    errorMessage
                );
                return;
            }
        }
        
        log.info("Message validation passed. isMatched={}, hasExistingMessages={}. Proceeding to save message.", 
            isMatched, hasExistingMessages);

        // If they have existing messages, add them to match cache for future messages
        if (hasExistingMessages && !isMatched) {
            log.info("Users have existing messages, adding to match cache");
            matchService.addMatch(message.getSenderId(), message.getReceiverId());
        }

        try {
            // Check if this is the first message between these users
            boolean isFirstMessage = !hasExistingMessages;
            
            Message savedMessage = messageService.saveMessage(message);
            log.info("Message saved successfully with ID: {} to database", savedMessage.getId());
            
            // Give 10 credits for starting first chat
            if (isFirstMessage) {
                try {
                    userServiceClient.addCredits(UUID.fromString(message.getSenderId()), 10);
                    log.info("Added 10 credits to user {} for starting first chat with {}", message.getSenderId(), message.getReceiverId());
                } catch (Exception e) {
                    log.warn("Failed to add credits for first chat: {}", e.getMessage());
                    // Don't fail the message if credits update fails
                }
            }
            
            try {
                eventProducerUtility.sendMessageEvent(
                    savedMessage.getSenderId(),
                    savedMessage.getReceiverId(),
                    savedMessage.getTimestamp().toString(),
                    savedMessage.getContent()
                );
                log.info("Message event published to Kafka successfully");
            } catch (Exception e) {
                log.error("Error publishing message event to Kafka: {}", e.getMessage(), e);
                // Continue even if event publishing fails - message is already saved
            }

            messagingTemplate.convertAndSend(
                    "/queue/messages/" + message.getReceiverId(),
                    savedMessage
            );
            log.info("Message sent via WebSocket to receiver: {}", message.getReceiverId());

            messagingTemplate.convertAndSend(
                    "/queue/messages/" + message.getSenderId(),
                    savedMessage
            );
            log.info("Message sent via WebSocket to sender: {}", message.getSenderId());

            log.info("Message processed and sent successfully to both users");
        } catch (Exception e) {
            log.error("Error processing message: {}", e.getMessage(), e);
            // Send error notification to sender
            Message errorMessage = new Message();
            errorMessage.setSenderId("system");
            errorMessage.setReceiverId(message.getSenderId());
            errorMessage.setContent("Failed to send message. Please try again.");
            messagingTemplate.convertAndSend(
                "/queue/messages/" + message.getSenderId(),
                errorMessage
            );
        } finally {
            // Clear the token from ThreadLocal after processing
            AuthTokenHolder.clear();
        }
    }

    @GetMapping("/messages")
    @ResponseBody
    public List<Message> getChatHistory(@RequestParam String senderId, @RequestParam String receiverId) {
        log.info("Getting chat history for senderId: {}, receiverId: {}", senderId, receiverId);
        
        // Get chat history first
        List<Message> history = messageService.getChatHistory(senderId, receiverId);
        
        // If history exists, users are considered matched (messages can only exist between matched users)
        if (!history.isEmpty()) {
            log.info("Found {} messages between users {} and {}", history.size(), senderId, receiverId);
            return history;
        }
        
        // If no history, check if they're matched (for new conversations)
        if (matchService.isMatch(senderId, receiverId)) {
            log.info("Users are matched but have no message history yet");
            return List.of();
        }
        
        log.warn("Users {} and {} are not matched and have no message history. Chat history access denied.", senderId, receiverId);
        return List.of();
    }

    @GetMapping("/check-match/{userId1}/{userId2}")
    @ResponseBody
    public boolean checkMatch(@PathVariable String userId1, @PathVariable String userId2) {
        return matchService.isMatch(userId1, userId2);
    }

    @GetMapping("/conversations")
    @ResponseBody
    public Map<String, Message> getAllConversations(@RequestParam String userId) {
        log.info("Getting all conversations for user: {}", userId);
        return messageService.getAllConversations(userId);
    }
}
