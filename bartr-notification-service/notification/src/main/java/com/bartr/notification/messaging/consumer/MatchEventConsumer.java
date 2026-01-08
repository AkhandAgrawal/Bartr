package com.bartr.notification.messaging.consumer;

import com.bartr.notification.UserServiceClient;
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
import java.util.UUID;

import static com.bartr.notification.Constants.NEW_MATCH;

@Component
@RequiredArgsConstructor
@Slf4j
public class MatchEventConsumer {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UserServiceClient userServiceClient;

    @KafkaListener(topics = "matched_topic", groupId = "notification-app")
    public void consume(GenericRecord record) {
        String user1Id = record.get("user1Id").toString();
        String user2Id = record.get("user2Id").toString();

        // Give 5 credits to each user for matching
        try {
            userServiceClient.addCredits(UUID.fromString(user1Id), 5);
        } catch (Exception e) {
            log.warn("Failed to add credits to user {} for matching: {}", user1Id, e.getMessage());
        }

        try {
            userServiceClient.addCredits(UUID.fromString(user2Id), 5);
        } catch (Exception e) {
            log.warn("Failed to add credits to user {} for matching: {}", user2Id, e.getMessage());
        }

        // Convert GenericRecord to Map for JSON serialization
        Map<String, Object> payloadMap = convertGenericRecordToMap(record);
        
        Notification notification1 = new Notification();
        notification1.setType(NEW_MATCH);
        notification1.setMessage("You have a new match");
        notification1.setUserId(user1Id);
        notification1.setPayload(payloadMap);
        notification1.setTimestamp(Instant.now());
        notification1.setRead(false);
        notificationRepository.save(notification1);

        Notification notification2 = new Notification();
        notification2.setType(NEW_MATCH);
        notification2.setMessage("You have a new match");
        notification2.setUserId(user2Id);
        notification2.setPayload(payloadMap);
        notification2.setTimestamp(Instant.now());
        notification2.setRead(false);
        notificationRepository.save(notification2);

        messagingTemplate.convertAndSend("/topic/notifications/" + user1Id, notification1);
        messagingTemplate.convertAndSend("/topic/notifications/" + user2Id, notification2);
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