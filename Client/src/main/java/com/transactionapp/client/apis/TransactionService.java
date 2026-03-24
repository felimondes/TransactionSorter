package com.transactionapp.client.apis;

import com.transactionapp.client.dummyobjects.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class TransactionService {

    private final RestTemplate restTemplate;
    private static final String BASE_URL = "http://localhost:8080/transactions";

    public TransactionService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Transaction getTransactionById(Long id) {
        try {
            return restTemplate.getForObject(BASE_URL + "/" + id, Transaction.class);
        } catch (HttpClientErrorException.NotFound e) {
            System.err.println("Transaction not found: " + id);
            return null;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch transaction: " + e.getMessage(), e);
        }
    }

    public Transaction createTransaction(Transaction transaction) {
        try {
            return restTemplate.postForObject(BASE_URL, transaction, Transaction.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create transaction: " + e.getMessage(), e);
        }
    }

    public List<Transaction> getUnsortedTransactions() {
        try {
            Transaction[] transactions = restTemplate.getForObject(BASE_URL, Transaction[].class);
            return transactions != null ? Arrays.asList(transactions) : Collections.emptyList();
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch transactions: " + e.getMessage(), e);
        }
    }

    public void deleteTransaction(Long transactionId) {

        try {
            restTemplate.delete(BASE_URL + "/" + transactionId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete transaction: " + e.getMessage(), e);
        }
    }
}