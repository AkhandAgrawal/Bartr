package com.bartr.user.domain.repositories;

import com.bartr.user.domain.entities.SkillsWanted;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillWantedRepository extends JpaRepository<SkillsWanted, Long> {
    List<SkillsWanted> findBySkillName(String skill);
}
