package com.transactionapp.transactionsorter.StatisticsService;

import com.transactionapp.transactionsorter.ErrorHandling.StatisticsException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService service;

    public StatisticsController(StatisticsService statisticsService) {
        this.service = statisticsService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyStatistics> viewPerMonthAndYear(
            @RequestParam int month,
            @RequestParam int year
    ) {
        Month m = Month.of(month); // 1 = JANUARY
        MonthlyStatistics stats = service.viewPerMonthAndYear(month, year);
        return ResponseEntity.ok(stats);
    }
}