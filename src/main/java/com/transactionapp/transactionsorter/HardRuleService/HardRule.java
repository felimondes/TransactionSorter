package com.transactionapp.transactionsorter.HardRuleService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import jakarta.persistence.*;
@Entity
public class HardRule {

    @Id
    String description;

    @ManyToOne
    @JoinColumn(name = "bucket_id")
    private Bucket bucket;

    public HardRule(String description, Bucket bucket) {
        this.description = description;
        this.bucket = bucket;
    }

    public HardRule() { }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Bucket getBucket() { return bucket; }
    public void setBucket(Bucket bucket) { this.bucket = bucket; }
}
