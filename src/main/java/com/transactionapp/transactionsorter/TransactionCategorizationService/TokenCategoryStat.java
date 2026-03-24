package com.transactionapp.transactionsorter.TransactionCategorizationService;

import com.transactionapp.transactionsorter.BucketService.Bucket;import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

@Entity
public class TokenCategoryStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String token;
    private String category;
    private int count;
    private LocalDateTime lastUpdated;
    private Long bucketId;

    public TokenCategoryStat() {}

    public TokenCategoryStat(String token, String category, int count, Long bucketId) {
        this.bucketId = bucketId;
        this.token = token;
        this.category = category;
        this.count = count;
    }

    public void increment() {
        this.count++;
        this.lastUpdated = LocalDateTime.now();
    }

    public void decrement() {
        this.count--;
    }

    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public String getCategory() {
        return category;
    }

    public int getCount() {
        return count;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public Long getBucketId() {
        return bucketId;
    }
}