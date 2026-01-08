package com.bartr.chat.domain.entities;

import com.bartr.chat.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndex(def = "{'senderId': 1, 'receiverId': 1, 'timestamp': -1}")
public class Message {
    @Id
    private String id;

    @Indexed
    private String senderId;

    @Indexed
    private String receiverId;

    private String content;

    @Indexed
    private Instant timestamp;

    private MessageStatus status = MessageStatus.SENT;
}


