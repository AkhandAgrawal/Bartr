package com.bartr.notification.messaging.consumer;

import com.bartr.notification.domain.entities.Notification;
import com.bartr.notification.domain.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.util.Utf8;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static com.bartr.notification.Constants.NEW_MESSAGE;

@Component
@RequiredArgsConstructor
@Slf4j
public class MessageEventConsumer {
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    @KafkaListener(topics = "message_topic", groupId = "notification-app")
    public void consume(GenericRecord record) {
        try {
            Object senderIdObj = record.get("senderId");
            Object receiverIdObj = record.get("receiverId");
            Object messageObj = record.get("message");
            
            String senderId = senderIdObj != null ? senderIdObj.toString().trim() : "null";
            String receiverId = receiverIdObj != null ? receiverIdObj.toString().trim() : "null";
            String messageContent = messageObj != null ? messageObj.toString() : "null";
            
            if (receiverId == null || receiverId.equals("null") || receiverId.isEmpty()) {
                log.error("Invalid receiverId in message event: '{}'", receiverId);
                return;
            }
            
            // Convert GenericRecord to Map for JSON serialization
            Map<String, Object> payloadMap = convertGenericRecordToMap(record);
            
            Notification notification = new Notification();
            notification.setType(NEW_MESSAGE);
            notification.setMessage("You have a new message!");
            notification.setUserId(receiverId);
            notification.setPayload(payloadMap);
            notification.setTimestamp(Instant.now());
            notification.setRead(false);
            
            Notification savedNotification = notificationRepository.save(notification);
            messagingTemplate.convertAndSend("/topic/notifications/" + receiverId, notification);
        } catch (Exception e) {
            log.error("Error processing message event: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Converts a GenericRecord to a Map for JSON serialization.
     * This avoids Jackson serialization issues with Avro schema objects.
     * Also converts Avro Utf8 objects to plain Strings.
     */
    private Map<String, Object> convertGenericRecordToMap(GenericRecord record) {
        Map<String, Object> map = new HashMap<>();
        if (record != null) {
            for (org.apache.avro.Schema.Field field : record.getSchema().getFields()) {
                Object value = record.get(field.name());
                // Convert nested GenericRecords recursively
                if (value instanceof GenericRecord) {
                    map.put(field.name(), convertGenericRecordToMap((GenericRecord) value));
                } else if (value instanceof Utf8) {
                    // Convert Avro Utf8 to plain String
                    map.put(field.name(), value.toString());
                } else if (value != null) {
                    // Convert other types to string if they're CharSequence (like Utf8)
                    if (value instanceof CharSequence) {
                        map.put(field.name(), value.toString());
                    } else {
                        map.put(field.name(), value);
                    }
                } else {
                    map.put(field.name(), null);
                }
            }
        }
        return map;
    }
}
