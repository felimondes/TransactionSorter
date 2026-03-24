package com.transactionapp.transactionsorter.TransactionService;


import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/{id}")
    public Transaction getTransactionById(@PathVariable Long id) {
        return transactionService.getTransactionById(id);
    }

    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transactionDTO) {
        String transactionName = transactionDTO.getDescription();
        LocalDate transactionDate = transactionDTO.getDate();
        BigDecimal transactionAmount = transactionDTO.getAmount();
        return transactionService.createTransaction(new Transaction(transactionName, transactionDate, transactionAmount));
    }

    @GetMapping
    public List<Transaction> getUnsortedTransactions() {
        return transactionService.getUnsortedTransactions();
    }

    @DeleteMapping("/{id}")
    public void deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
    }

}