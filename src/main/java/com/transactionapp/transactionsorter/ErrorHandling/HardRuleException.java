package com.transactionapp.transactionsorter.ErrorHandling;

public class HardRuleException extends RuntimeException {
    public HardRuleException(String message) {
        super(message);
    }
}
