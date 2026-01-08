package com.bartr.matching.utility;

import com.bartr.matching.avro.MatchEvent;
import com.bartr.matching.messaging.MatchEventProducer;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@AllArgsConstructor
public class EventProducerUtility {
    private MatchEventProducer matchEventProducer;

    public void sendMatchEvent(UUID user1Id, UUID user2Id) {
        MatchEvent event = new MatchEvent();
        event.setUser1Id(user1Id.toString());
        event.setUser2Id(user2Id.toString());
        event.setMatchedTimestamp(Instant.now().toString());
        matchEventProducer.sendMessage(event);
    }
}
