package com.transactionapp.transactionsorter.TransactionService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketDeletedEvent;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.TransactionNotFoundException;
import com.transactionapp.transactionsorter.StatisticsService.BucketAverage;
import com.transactionapp.transactionsorter.TransactionService.events.TransactionAddedToBucketEvent;
import com.transactionapp.transactionsorter.TransactionService.events.TransactionRemovedFromBucketEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final BucketService bucketService;

    public TransactionService(TransactionRepository transactionRepository,
                              ApplicationEventPublisher eventPublisher, BucketService bucketService) {
        this.transactionRepository = transactionRepository;
        this.eventPublisher = eventPublisher;
        this.bucketService = bucketService;
    }

    public Transaction createTransaction(TransactionCreationRequest r) {
        Transaction transaction = new Transaction(r.description(), r.date(), r.amount());
        transactionRepository.save(transaction);
        eventPublisher.publishEvent(new TransactionCreatedEvent(transaction));
        return transaction;
    }

    // --- Retrieve ---
    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found: " + id));
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public List<Transaction> getUnsortedTransactions() {
        return transactionRepository.findByBucketIsNull();
    }

    public List<Transaction> getTransactionsByBucket(Long bucketId) {
        Bucket bucket = bucketService.getBucket(bucketId);
        return transactionRepository.findByBucket(bucket);
    }

    // --- Update ---
    @Transactional
    public Transaction updateTransaction(Long transactionId, TransactionUpdateRequest request) {
        Transaction tx = getTransactionById(transactionId);

        tx.updateDescription(request.getDescription());
        tx.updateAmount(request.getAmount());
        tx.updateDate(request.getDate());
        handleBucketAssignment(tx, request);

        return transactionRepository.save(tx);
    }

    private void handleBucketAssignment(Transaction tx, TransactionUpdateRequest request) {
        if (request.isRemoveBucket()) {
            removeTransactionFromBucket(tx);
        } else if (request.getBucketId() != null) {
            Bucket bucket = bucketService.getBucket(request.getBucketId());
            addTransactionToBucket(tx, bucket);
        }
    }

    private void addTransactionToBucket(Transaction tx, Bucket bucket) {
            tx.assignToBucket(bucket);
            eventPublisher.publishEvent(new TransactionAddedToBucketEvent(tx, bucket));
    }
    private void removeTransactionFromBucket(Transaction tx) {
        Bucket oldBucket = tx.getBucket();
        tx.removeFromBucket();
        if (oldBucket != null) {
            eventPublisher.publishEvent(new TransactionRemovedFromBucketEvent(tx, oldBucket));
        }
    }

    @EventListener
    public void handleBucketDeletedEvent(BucketDeletedEvent event) {
        Bucket bucket = event.getBucket();
        transactionRepository.deleteAllByBucket(bucket);
    }

    // --- Delete ---
    public void deleteTransaction(Long transactionId) {
        Transaction tx = getTransactionById(transactionId);
        transactionRepository.delete(tx);
    }


}