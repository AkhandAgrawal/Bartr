package com.bartr.user.domain.repositories;

import com.bartr.user.domain.entities.SkillsOffered;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillOfferedRepository extends JpaRepository<SkillsOffered, Long> {
    List<SkillsOffered> findBySkillName(String skill);
}
