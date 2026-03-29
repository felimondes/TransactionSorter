package com.transactionapp.transactionsorter.TransactionService;


import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.StatisticsService.BucketAverage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByBucketIsNull();
    List<Transaction> findByBucket(Bucket bucket);

    @Query("""
    SELECT t.bucket.id AS bucketId, t.bucket.name AS bucketName, AVG(t.amount) AS averagePerMonth
    FROM Transaction t
    GROUP BY t.bucket.id, t.bucket.name
""")
    List<BucketAverage> findAveragePerMonthByBucket();
    void deleteById(Long id);
    void deleteAllByBucket(Bucket bucket);


    @Query("""
    SELECT t.tag, SUM(t.amount)
    FROM Transaction t
    WHERE t.date BETWEEN :start AND :end
    GROUP BY t.tag
""")
    List<Object[]> getSumPerTag(LocalDate start, LocalDate end);

    @Query("""
    SELECT SUM(t.amount)
    FROM Transaction t
    WHERE t.date BETWEEN :start AND :end
""")
    BigDecimal getTotalSum(LocalDate start, LocalDate end);


}
