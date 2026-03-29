package com.transactionapp.transactionsorter.StatisticsService;


import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.StatisticsException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionRepository;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final TransactionRepository transactionRepository;

    public StatisticsService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }
    

    public MonthlyStatistics viewPerMonthAndYear(int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<Object[]> perTagRaw = transactionRepository.getSumPerTag(start, end);
        BigDecimal total = transactionRepository.getTotalSum(start, end);

        if ((perTagRaw == null || perTagRaw.isEmpty()) && total == null) {
            throw new StatisticsException("No transactions found for the specified month and year");
        }

        Map<String, BigDecimal> perTag = new HashMap<>();
        for (Object[] row : perTagRaw) {
            String tag = (String) row[0];
            BigDecimal sum = (BigDecimal) row[1];
            perTag.put(tag, sum);
        }
        return new MonthlyStatistics(
                total != null ? total : new BigDecimal(String.valueOf(0.0)),
                perTag
        );
    }
}
