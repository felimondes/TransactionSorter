package com.transactionapp.transactionsorter.TransactionService;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionUpdateRequest {

    private String description;
    private LocalDate date;
    private BigDecimal amount;

    // getters + setters
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

}