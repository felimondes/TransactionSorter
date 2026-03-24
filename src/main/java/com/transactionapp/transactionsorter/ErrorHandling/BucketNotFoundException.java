package com.transactionapp.transactionsorter.ErrorHandling;

public class BucketNotFoundException extends RuntimeException {
    public BucketNotFoundException(Long transactionId) {
        super("id: " + transactionId);
    }

    public BucketNotFoundException(String message) {
        super(message);
    }
}