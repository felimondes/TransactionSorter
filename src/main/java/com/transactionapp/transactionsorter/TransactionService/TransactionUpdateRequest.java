package com.transactionapp.transactionsorter.TransactionService;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionUpdateRequest {

    private String description;
    private LocalDate date;
    private BigDecimal amount;

    private Long bucketId;
    private boolean isRemoveBucket;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final TransactionUpdateRequest instance = new TransactionUpdateRequest();

        public Builder bucketId(Long bucketId) {
            instance.bucketId = bucketId; return this;
        }
        public Builder description(String description) { instance.description = description; return this; }
        public Builder amount(BigDecimal amount) { instance.amount = amount; return this; }
        public Builder date(LocalDate date) { instance.date = date; return this; }
        public Builder removeBucket(boolean removeBucket) { instance.isRemoveBucket = removeBucket; return this; }

        public TransactionUpdateRequest build() { return instance; }
    }


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

    public Long getBucketId() {
        return bucketId;
    }

    public void setBucketId(Long bucketId) {
        this.bucketId = bucketId;
    }

    public boolean isRemoveBucket() {
        return isRemoveBucket;
    }

    public void setRemoveBucket(boolean removeBucket) {
        isRemoveBucket = removeBucket;
    }
}