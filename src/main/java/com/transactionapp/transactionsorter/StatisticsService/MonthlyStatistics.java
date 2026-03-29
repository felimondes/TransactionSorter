package com.transactionapp.transactionsorter.StatisticsService;

import java.math.BigDecimal;
import java.util.Map;

public class MonthlyStatistics {
    private BigDecimal total;
    private Map<String, BigDecimal> perTag;

    public MonthlyStatistics(BigDecimal total, Map<String, BigDecimal> perTag) {
        this.total = total;
        this.perTag = perTag;
    }

    public BigDecimal getTotal() {
        return total;
    }


    public Map<String, BigDecimal> getPerTag() {
        return perTag;
    }

}
