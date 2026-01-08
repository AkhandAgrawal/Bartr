package com.bartr.chat.application.runtime;

import com.bartr.chat.domain.entities.Message;
import com.bartr.chat.domain.repositories.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
class MongoDBConnectionCheck implements CommandLineRunner {
    private final MongoTemplate mongoTemplate;
    private final MessageRepository messageRepository;

    @Override
    public void run(String... args) {
        try {
            log.info("Checking MongoDB connection...");
            mongoTemplate.getDb().getName();
            log.info("MongoDB is connected successfully!");

            if (messageRepository.count() == 0) {
                Message testMessage = new Message();
                testMessage.setSenderId("system");
                testMessage.setReceiverId("all");
                testMessage.setContent("Chat service initialized");
                testMessage.setTimestamp(Instant.now());
                messageRepository.save(testMessage);
                log.info("Test message created to initialize database");
            }
        } catch (Exception e) {
            log.error("Error connecting to MongoDB: {}", e.getMessage(), e);
        }
    }
}