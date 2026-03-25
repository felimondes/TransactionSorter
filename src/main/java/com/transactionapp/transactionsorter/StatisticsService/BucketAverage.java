package com.transactionapp.transactionsorter.StatisticsService;

import java.math.BigDecimal;

public interface BucketAverage {
    Long getBucketId();
    BigDecimal getAveragePerMonth();
    String getBucketName();
}