package com.transactionapp.transactionsorter;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketRepository;
import com.transactionapp.transactionsorter.TransactionCategorizationService.TransactionCategorizationService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;


import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootApplication
public class TransactionSorterApplication {

    public static void main(String[] args) throws InterruptedException {
        ApplicationContext context = SpringApplication.run(TransactionSorterApplication.class, args);

        TransactionCategorizationService service = context.getBean(TransactionCategorizationService.class);
        TransactionRepository trepo = context.getBean(TransactionRepository.class);
        BucketRepository brepo = context.getBean(BucketRepository.class);

        for (int i = 0; i < 5; i++) {
            createTransaction(trepo, brepo);
        }
    }

    private static void createTransaction(TransactionRepository trepo, BucketRepository brepo) {
        int k = 50 * 12 * 3;
        Bucket bucket = new Bucket("forkem");
        brepo.save(bucket);
        for (int i = 1; i <= k; i++) {
            Transaction t = new Transaction("cock", LocalDate.parse("2026-01-01"), new BigDecimal("100.00"));
            trepo.save(t);
            bucket.addTransaction(t);
        }
    }
}

