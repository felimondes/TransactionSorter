package com.transactionapp.transactionsorter.ErrorHandling;

public class TransactionParserException extends RuntimeException {
    public TransactionParserException(Long transactionId) {
        super("id: " + transactionId);
    }

    public TransactionParserException(String message) {
        super(message);
    }
}