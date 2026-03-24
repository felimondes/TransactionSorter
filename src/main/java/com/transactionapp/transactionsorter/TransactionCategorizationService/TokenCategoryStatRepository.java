package com.transactionapp.transactionsorter.TransactionCategorizationService;

import com.transactionapp.transactionsorter.TransactionCategorizationService.TokenCategoryStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TokenCategoryStatRepository extends JpaRepository<TokenCategoryStat, Long> {

    Optional<TokenCategoryStat> findByTokenAndCategory(String token, String category);

    List<TokenCategoryStat> findByToken(String token);

    Optional<TokenCategoryStat> findByBucketIdAndTokenAndCategory(Long bucketId, String token, String category);
}