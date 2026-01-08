package com.bartr.notification.domain.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String type;
    private String message;
    private String userId;
    
    // Store as Map - MongoDB will handle it as a Document
    // The controller uses MongoTemplate to manually convert, avoiding GenericRecord deserialization issues
    private Map<String, Object> payload;
    
    private Boolean read = false;
    private Instant timestamp;
}

