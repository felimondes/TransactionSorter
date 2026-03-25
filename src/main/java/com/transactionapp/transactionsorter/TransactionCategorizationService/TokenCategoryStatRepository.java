package com.transactionapp.transactionsorter.TransactionCategorizationService;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TokenCategoryStatRepository extends JpaRepository<TokenCategoryStat, Long> {

    Optional<TokenCategoryStat> findById(TokenCategoryStatId id);
    List<TokenCategoryStat> findById_Token(String idToken);
}