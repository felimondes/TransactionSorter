package com.transactionapp.transactionsorter.StatisticsService;


import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.StatisticsException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final TransactionService transactionService;

    public StatisticsService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public Map<Long, BigDecimal> getAverageSpentPerMonthByCategory() {
        List<BucketAverage> averages = transactionService.findAveragePerMonthByBucket();

        Map<Long, BigDecimal> result = averages.stream()
                .filter(avg -> avg.getBucketId() != null
                        && avg.getBucketName() != null
                        && avg.getAveragePerMonth() != null)
                .collect(Collectors.toMap(
                        BucketAverage::getBucketId,
                        avg -> avg.getAveragePerMonth().setScale(2, RoundingMode.HALF_UP)
                ));

        if (result.isEmpty()) {
            throw new StatisticsException("Fill buckets with transactions to see statistics");
        }
        return result;
    }

}
