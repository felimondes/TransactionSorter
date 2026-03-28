package com.transactionapp.transactionsorter.TransactionService;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionUpdateRequest {

    private String description;
    private LocalDate date;
    private BigDecimal amount;
    private String tag;
    private boolean removeTag;

    // getters + setters
    public void setTag(String tag) {
        this.tag = tag;
    }

    public void markRemoveTag() { removeTag = true; }

    public boolean isRemoveTag() { return removeTag; }

    public String getTag() {
        return tag;
    }
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