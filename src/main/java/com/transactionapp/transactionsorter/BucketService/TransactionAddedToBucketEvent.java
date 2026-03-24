package com.transactionapp.transactionsorter.BucketService;


import com.transactionapp.transactionsorter.TransactionService.Transaction;

public class TransactionAddedToBucketEvent {
    private final Transaction transaction;
    private final Bucket bucket;

    public TransactionAddedToBucketEvent(Transaction transaction, Bucket bucket) {
        this.transaction = transaction;
        this.bucket = bucket;
    }

    public Transaction getTransaction() { return transaction; }
    public Bucket getBucket() { return bucket; }
}