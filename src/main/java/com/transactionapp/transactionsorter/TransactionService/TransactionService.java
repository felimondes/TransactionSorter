package com.transactionapp.transactionsorter.TransactionService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.ErrorHandling.TransactionNotFoundException;
import com.transactionapp.transactionsorter.StatisticsService.BucketAverage;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;import java.time.LocalDate;import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    // Create a new transaction
    public Transaction createTransaction(String description, LocalDate date, BigDecimal amount) {
        Transaction transaction = new Transaction(description, date, amount);
        return transactionRepository.save(transaction);
    }

    public Transaction createTransaction(String description) {
        Transaction transaction = new Transaction(description);
        return transactionRepository.save(transaction);
    }

    public Transaction getTransactionById(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Transaction not found with id: " + transactionId));
    }

    // Save updates to an existing transaction
    public Transaction saveTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    // Delete transaction by ID
    public void deleteTransaction(Long transactionId) {
        if (!transactionRepository.existsById(transactionId)) {
            throw new TransactionNotFoundException(
                    "Transaction not found with id: " + transactionId);
        }
        transactionRepository.deleteById(transactionId);
    }

    // Get transactions not assigned to any bucket
    public List<Transaction> getUnsortedTransactions() {
        return transactionRepository.findByBucketIsNull();
    }

    // Get all transactions in a bucket
    public List<Transaction> getTransactionsByBucket(Bucket bucket) {
        return transactionRepository.findByBucket(bucket);
    }

    //testing

        public List<Transaction> getAllTransactions() {
            return transactionRepository.findAll();
        }

    public List<BucketAverage> findAveragePerMonthByBucket() {
        return transactionRepository.findAveragePerMonthByBucket();
    }
}