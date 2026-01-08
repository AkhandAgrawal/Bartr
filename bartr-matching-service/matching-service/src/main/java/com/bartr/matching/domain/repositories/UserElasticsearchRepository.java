package com.bartr.matching.domain.repositories;

import com.bartr.matching.UserDocument;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserElasticsearchRepository extends ElasticsearchRepository<UserDocument, UUID> {

    @Query("{\"term\": {\"keycloakId\": \"?0\"}}")
    Optional<UserDocument> getUserProfileByKeycloakId(UUID keycloakId);
}
