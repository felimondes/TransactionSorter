package com.transactionapp.transactionsorter.TransactionCategorizationService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class TokenCategoryStat {

    @EmbeddedId
    private TokenCategoryStatId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("bucketId") // maps the bucketId inside TokenCategoryStatId
    @JoinColumn(name = "bucket_id")
    private Bucket bucket;

    private int count;
    private LocalDateTime lastUpdated;
    private String category;


    public TokenCategoryStat() {}

    public TokenCategoryStat(String token, Bucket bucket) {
        this.id = new TokenCategoryStatId(bucket.getId(), token);
        this.bucket = bucket;
        this.count = 0;
        this.lastUpdated = LocalDateTime.now();
        this.category = bucket.getName();
    }



    public void increment() {
        this.count++;
        this.lastUpdated = LocalDateTime.now();
    }

    public void decrement() {
        this.count--;
    }

    public TokenCategoryStatId getId() {
        return id;
    }



    public int getCount() {
        return count;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }


    public String getCategory() {
        return category;
    }

    public Long getBucketId() {
        return id.getBucketId();
    }

    public String getToken() {
        return id.getToken();
    }
}