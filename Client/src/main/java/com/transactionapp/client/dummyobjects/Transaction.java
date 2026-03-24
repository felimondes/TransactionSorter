package com.transactionapp.client.dummyobjects;


import java.math.BigDecimal;
import java.time.LocalDate;

public class Transaction {

    private Long id;
    private String description;
    private LocalDate date;
    private BigDecimal amount;
    private Bucket bucket;

    public Transaction() {
    }

    public Transaction(String description, LocalDate date, BigDecimal amount) {
        this.description = description;
        this.date = date;
        this.amount = amount;
    }

    public Bucket getBucket() {
        return bucket;
    }

    public void setBucket(Bucket bucket) {
        this.bucket = bucket;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

