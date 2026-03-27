package com.transactionapp.transactionsorter.TransactionService;
import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.persistence.*;

public class TransactionDTO {

    private Long id;
    private Long bucket_id;
    private String description;
    private LocalDate date;
    private BigDecimal amount;
    private final LocalDate creationDate = LocalDate.now();

    protected TransactionDTO() {}

    public TransactionDTO(String description, LocalDate date, BigDecimal amount) {
        this.description = description;
        this.date = date;
        this.amount = amount;
    }

    public TransactionDTO(String description) {
        this(description, null, null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBucket_id() {
        return bucket_id;
    }

    public void setBucket_id(Long bucket_id) {
        this.bucket_id = bucket_id;
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

    public LocalDate getCreationDate() {
        return creationDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Transaction)) return false;
        return id != null && id.equals(((Transaction) o).getId());
    }

    @Override
    public int hashCode() {
        return 31;
    }
}