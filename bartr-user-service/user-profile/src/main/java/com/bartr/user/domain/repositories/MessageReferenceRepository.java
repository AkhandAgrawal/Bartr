package com.bartr.user.domain.repositories;

import com.bartr.user.domain.entities.MessageReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface MessageReferenceRepository extends JpaRepository<MessageReference, Long> {
    MessageReference findByMessageCode(String messageCode);
}
