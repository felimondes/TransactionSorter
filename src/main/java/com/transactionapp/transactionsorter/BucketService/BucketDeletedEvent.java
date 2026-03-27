package com.transactionapp.transactionsorter.BucketService;

import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import org.springframework.context.ApplicationEvent;

public class BucketDeletedEvent extends ApplicationEvent {
    Bucket bucket;
    public BucketDeletedEvent(Object source, Bucket bucket) {
        super(source);
        this.bucket = bucket;
    }

    public Bucket getBucket() {
        return bucket;
    }
}
