package com.bartr.matching.messaging;

import com.bartr.matching.avro.MatchEvent;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.kafka.core.KafkaTemplate;

@Service
@AllArgsConstructor
public class MatchEventProducer {

    private final KafkaTemplate<String, MatchEvent>  kafkaTemplate;

    public void sendMessage(MatchEvent event){
        kafkaTemplate.send("matched_topic", event);
    }
}
