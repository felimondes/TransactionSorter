package com.transactionapp.transactionsorter.TransactionService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bucket_id")
    private Bucket bucket;


    private String description;
    private LocalDate date;
    private BigDecimal amount;

    public Transaction(String description, LocalDate date, BigDecimal amount) {
        this.description = description;
        this.date = date;
        this.amount = amount;
    }

    public Transaction(String description) {
        this.description = description;
    }

    protected Transaction() {

    }

    @PostUpdate
    public void postUpdate() {
        System.out.println("Transaction with ID " + id + " updated");
    }

    @PostPersist
    public void prePersist() {
        System.out.println("Transaction with ID " + id + " persisted");
    }

    public Long getId() {
        return id;
    }

    public Bucket getBucket() {
        return bucket;
    }

    public String getDescription() {
        return description;
    }

    public LocalDate getDate() {
        return date;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setId(Long id) {
        this.id = id;
    }
    protected void setDescription(String description) {
        this.description = description;
    }
    public void setBucket(Bucket bucket) {
        this.bucket = bucket;
    }
    protected void setDate(LocalDate date) {
        this.date = date;
    }
    protected void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Transaction that = (Transaction) obj;
        return Objects.equals(that.id, this.id);
    }
}
