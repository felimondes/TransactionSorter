package com.transactionapp.transactionsorter.TransactionService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "bucket_id")
    private Bucket bucket;

    private String description;
    private LocalDate date;
    private BigDecimal amount;
    private final LocalDate creationDate = LocalDate.now();

    protected Transaction() {}

    public Transaction(String description, LocalDate date, BigDecimal amount) {
        this.description = description;
        this.date = date;
        this.amount = amount;
    }

    public Transaction(String description) {
        this(description, null, null);
    }

    // --- Domain behavior ---
    public void assignToBucket(Bucket bucket) {
        this.bucket = bucket;
    }

    public void removeFromBucket() {
        this.bucket = null;
    }

    public void updateDescription(String description) {
        if (description != null) this.description = description;
    }

    public void updateAmount(BigDecimal amount) {
        if (amount != null) this.amount = amount;
    }

    public void updateDate(LocalDate date) {
        if (date != null) this.date = date;
    }

    // --- Getters ---
    public Long getId() { return id; }
    public Bucket getBucket() { return bucket; }
    public String getDescription() { return description; }
    public LocalDate getDate() { return date; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getCreationDate() { return creationDate; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Transaction)) return false;
        return id != null && id.equals(((Transaction) o).id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}