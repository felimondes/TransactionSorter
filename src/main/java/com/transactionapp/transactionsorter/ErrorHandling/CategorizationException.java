package com.transactionapp.transactionsorter.ErrorHandling;

public class CategorizationException extends RuntimeException {
    public CategorizationException(Long transactionId) {
        super("id: " + transactionId);
    }

    public CategorizationException(String message) {
        super(message);
    }
}
