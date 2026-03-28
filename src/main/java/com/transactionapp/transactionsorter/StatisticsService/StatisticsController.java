package com.transactionapp.transactionsorter.StatisticsService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService service;

    public StatisticsController(StatisticsService statisticsService) {
        this.service = statisticsService;
    }

    @GetMapping("/average-per-month")
    public Map<Long, BigDecimal> getAverageSpentPerMonthByCategory() {
        return service.getAverageSpentPerMonthByCategory();
    }
}