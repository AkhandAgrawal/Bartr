package com.bartr.chat.domain.repositories;

import com.bartr.chat.domain.entities.Message;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    @Query("{ $or: [ { $and: [ { 'senderId': ?0 }, { 'receiverId': ?1 } ] }, { $and: [ { 'senderId': ?1 }, { 'receiverId': ?0 } ] } ] }")
    List<Message> findChatHistory(String userId1, String userId2, Sort sort);
}
