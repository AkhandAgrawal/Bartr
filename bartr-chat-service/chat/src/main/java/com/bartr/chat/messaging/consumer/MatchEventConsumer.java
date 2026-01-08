package com.bartr.chat.messaging.consumer;

import com.bartr.chat.application.service.MatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.avro.generic.GenericRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MatchEventConsumer {

    private final MatchService matchService;

    @KafkaListener(topics = "matched_topic", groupId = "chat-app")
    public void consumeMatchEvent(GenericRecord record) {
        try {
            log.info("Received match event: user1Id={}, user2Id={}", 
                record.get("user1Id"), record.get("user2Id"));
            matchService.addMatch(record.get("user1Id").toString(), record.get("user2Id").toString());
            log.info("Successfully processed match event");
        } catch (Exception e) {
            log.error("Error processing match event: {}", e.getMessage(), e);
            // Don't re-throw - allow Kafka to continue processing other messages
        }
    }
}