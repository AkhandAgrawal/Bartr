package com.bartr.chat.messaging.producer;

import com.bartr.chat.avro.MessageEvent;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@AllArgsConstructor
@Slf4j
public class MessageEventProducer {
    private final KafkaTemplate<String, MessageEvent> kafkaTemplate;

    public void sendMessage(MessageEvent event){
        log.info("Publishing message event to Kafka topic 'message_topic'. senderId: {}, receiverId: {}, message: {}", 
            event.getSenderId(), event.getReceiverId(), event.getMessage());
        
        CompletableFuture<SendResult<String, MessageEvent>> future = kafkaTemplate.send("message_topic", event);
        
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Message event published successfully to Kafka. Topic: {}, Partition: {}, Offset: {}", 
                    result.getRecordMetadata().topic(), 
                    result.getRecordMetadata().partition(), 
                    result.getRecordMetadata().offset());
            } else {
                log.error("Failed to publish message event to Kafka: {}", ex.getMessage(), ex);
            }
        });
    }
}
