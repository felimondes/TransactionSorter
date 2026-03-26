package com.transactionapp.transactionsorter;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketRepository;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.BucketService.TransactionAddedToBucketEvent;
import com.transactionapp.transactionsorter.TransactionCategorizationService.TransactionCategorizationService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionRepository;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
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
    }
}

