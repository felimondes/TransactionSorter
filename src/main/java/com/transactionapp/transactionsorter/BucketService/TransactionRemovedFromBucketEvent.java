package com.transactionapp.transactionsorter.BucketService;

import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.BucketService.Bucket;

public class TransactionRemovedFromBucketEvent {
    private final Transaction transaction;
    private final Bucket bucket;

    public TransactionRemovedFromBucketEvent(Transaction transaction, Bucket bucket) {
        this.transaction = transaction;
        this.bucket = bucket;
    }

    public Transaction getTransaction() { return transaction; }
    public Bucket getBucket() { return bucket; }
}