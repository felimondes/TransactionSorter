package com.transactionapp.transactionsorter.ErrorHandling;

public class TransactionNotFoundException extends RuntimeException {
    public TransactionNotFoundException(Long transactionId) {
        super("id: " + transactionId);
    }

    public TransactionNotFoundException(String message) {
        super(message);
    }
}