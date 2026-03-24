package com.transactionapp.transactionsorter.TransactionService;
import com.transactionapp.transactionsorter.ErrorHandling.TransactionNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public Transaction createTransaction(Transaction transaction) {
        Transaction transaction1 = new Transaction(transaction.getDescription(), transaction.getDate(), transaction.getAmount());
        return transactionRepository.save(transaction1);
    }

    public Transaction getTransactionById(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Transaction not found with id: " + transactionId));
    }

    public List<Transaction> getUnsortedTransactions() {
        return transactionRepository.findByBucketIsNull();
    }

    public void deleteTransaction(Long transactionId) {
        if (!transactionRepository.existsById(transactionId)) {
            throw new TransactionNotFoundException("Transaction not found with id: " + transactionId);
        }
        transactionRepository.deleteById(transactionId);
    }
}