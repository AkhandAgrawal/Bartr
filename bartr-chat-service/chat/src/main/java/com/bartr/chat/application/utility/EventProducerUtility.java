package com.bartr.chat.application.utility;

import com.bartr.chat.avro.MessageEvent;
import com.bartr.chat.messaging.producer.MessageEventProducer;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class EventProducerUtility {
    private MessageEventProducer messageEventProducer;

    public void sendMessageEvent(String senderId, String receiverId, String messageTimestamp, String messageContent) {
        MessageEvent event = new MessageEvent();
        event.setSenderId(senderId);
        event.setReceiverId(receiverId);
        event.setMessageTimestamp(messageTimestamp);
        event.setMessage(messageContent);
        messageEventProducer.sendMessage(event);
    }
}
