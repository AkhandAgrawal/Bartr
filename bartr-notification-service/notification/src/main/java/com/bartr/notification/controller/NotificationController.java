package com.bartr.notification.controller;

import com.bartr.notification.domain.entities.Notification;
import com.bartr.notification.domain.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationRepository notificationRepository;
    private final MongoTemplate mongoTemplate;

    @GetMapping("/notifications/{userId}")
    @ResponseBody
    public List<Notification> getNotificationHistory(@PathVariable String userId) {
        try {
            // Use MongoTemplate to query and manually convert to avoid GenericRecord deserialization issues
            Query query = new Query(Criteria.where("userId").is(userId));
            List<Document> documents = mongoTemplate.find(query, Document.class, "notifications");
            
            List<Notification> notifications = new ArrayList<>();
            for (Document doc : documents) {
                Notification notification = new Notification();
                notification.setId(doc.getObjectId("_id").toString());
                notification.setType(doc.getString("type"));
                notification.setMessage(doc.getString("message"));
                notification.setUserId(doc.getString("userId"));
                notification.setRead(doc.getBoolean("read", false));
                
                // Handle timestamp - MongoDB stores Instant as Date
                Object timestampObj = doc.get("timestamp");
                if (timestampObj == null) {
                    notification.setTimestamp(Instant.now());
                } else if (timestampObj instanceof Instant) {
                    notification.setTimestamp((Instant) timestampObj);
                } else if (timestampObj instanceof Date) {
                    // MongoDB stores Instant as Date, convert it back
                    notification.setTimestamp(((Date) timestampObj).toInstant());
                } else if (timestampObj instanceof Number) {
                    // Handle epoch milliseconds
                    long epochMillis = ((Number) timestampObj).longValue();
                    notification.setTimestamp(Instant.ofEpochMilli(epochMillis));
                } else {
                    // Try to parse as ISO string or other format
                    try {
                        notification.setTimestamp(Instant.parse(timestampObj.toString()));
                    } catch (Exception e) {
                        log.warn("Could not parse timestamp for notification {}: {}", notification.getId(), e.getMessage());
                        // Set to current time as fallback
                        notification.setTimestamp(Instant.now());
                    }
                }
                
                // Convert payload Document to Map, handling any GenericRecord data
                Object payloadObj = doc.get("payload");
                if (payloadObj != null) {
                    notification.setPayload(convertPayloadToMap(payloadObj));
                }
                
                notifications.add(notification);
            }
            
            return notifications;
        } catch (Exception e) {
            log.error("Error fetching notifications for userId: {}", userId, e);
            return List.of();
        }
    }
    
    /**
     * Converts payload object (Document, Map, or GenericRecord) to Map<String, Object>
     */
    private Map<String, Object> convertPayloadToMap(Object payload) {
        if (payload == null) {
            return null;
        }
        
        if (payload instanceof Map) {
            Map<String, Object> result = new HashMap<>();
            for (Object key : ((Map<?, ?>) payload).keySet()) {
                Object value = ((Map<?, ?>) payload).get(key);
                // Skip _class field
                if (!"_class".equals(key.toString())) {
                    result.put(key.toString(), convertValue(value));
                }
            }
            return result;
        }
        
        if (payload instanceof Document) {
            Document doc = (Document) payload;
            Map<String, Object> result = new HashMap<>();
            for (String key : doc.keySet()) {
                // Skip _class field
                if (!"_class".equals(key)) {
                    result.put(key, convertValue(doc.get(key)));
                }
            }
            return result;
        }
        
        // If it's something else, return empty map
        log.warn("Unexpected payload type: {}", payload.getClass().getName());
        return new HashMap<>();
    }
    
    private Object convertValue(Object value) {
        if (value == null) {
            return null;
        }
        
        // Handle nested Documents
        if (value instanceof Document) {
            Map<String, Object> result = new HashMap<>();
            Document doc = (Document) value;
            for (String key : doc.keySet()) {
                if (!"_class".equals(key)) {
                    result.put(key, convertValue(doc.get(key)));
                }
            }
            return result;
        }
        
        // Handle nested Maps
        if (value instanceof Map) {
            Map<String, Object> result = new HashMap<>();
            for (Object key : ((Map<?, ?>) value).keySet()) {
                if (!"_class".equals(key.toString())) {
                    result.put(key.toString(), convertValue(((Map<?, ?>) value).get(key)));
                }
            }
            return result;
        }
        
        // Handle Lists
        if (value instanceof List) {
            List<Object> result = new ArrayList<>();
            for (Object item : (List<?>) value) {
                result.add(convertValue(item));
            }
            return result;
        }
        
        // Convert CharSequence to String
        if (value instanceof CharSequence) {
            return value.toString();
        }
        
        // Return primitives and other types as-is
        return value;
    }

    @DeleteMapping("/notifications/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String notificationId) {
        Optional<Notification> notification = notificationRepository.findById(notificationId);
        if (notification.isPresent()) {
            notificationRepository.deleteById(notificationId);
            return ResponseEntity.ok().build();
        } else {
            log.warn("Notification with id {} not found", notificationId);
            return ResponseEntity.notFound().build();
        }
    }
}
