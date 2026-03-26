package com.transactionapp.transactionsorter.HardRuleService;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HardRuleRepository extends JpaRepository<HardRule, String> {
    Optional<HardRule> findByDescription(String description);
}
