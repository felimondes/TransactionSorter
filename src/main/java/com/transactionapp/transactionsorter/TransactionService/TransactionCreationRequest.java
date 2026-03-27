package com.transactionapp.transactionsorter.TransactionService;
import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionCreationRequest(
    String description,
    LocalDate date,
    BigDecimal amount
) {}

