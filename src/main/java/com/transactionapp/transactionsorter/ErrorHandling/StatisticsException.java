package com.transactionapp.transactionsorter.ErrorHandling;

public class StatisticsException extends RuntimeException {
    public StatisticsException(Long transactionId) {
        super("id: " + transactionId);
    }

    public StatisticsException(String message) {
        super(message);
    }
}