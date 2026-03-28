package com.transactionapp.transactionsorter.TransactionService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.events.BucketDeletedEvent;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.TransactionNotFoundException;
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

    public Transaction create(TransactionCreationRequest r) {
        Transaction transaction = new Transaction(r.description(), r.date(), r.amount());
        transactionRepository.save(transaction);
        eventPublisher.publishEvent(new TransactionCreatedEvent(transaction));
        return transaction;
    }

    // --- Retrieve ---
    public Transaction getById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found: " + id));
    }

    public List<Transaction> getAll() {
        return transactionRepository.findAll();
    }

    public List<Transaction> getUnsorted() {
        return transactionRepository.findByBucketIsNull();
    }

    public List<Transaction> getByBucket(Long bucketId) {
        Bucket bucket = bucketService.get(bucketId);
        return transactionRepository.findByBucket(bucket);
    }

    // --- Delete ---
    public void delete(Long transactionId) {
        Transaction tx = getById(transactionId);
        transactionRepository.delete(tx);
    }

    // --- Update ---
    @Transactional
    public Transaction updateData(Long transactionId, TransactionUpdateRequest request) {
        Transaction tx = getById(transactionId);
        tx.updateDescription(request.getDescription());
        tx.updateAmount(request.getAmount());
        tx.updateDate(request.getDate());
        return transactionRepository.save(tx);
    }

    public Transaction assignBucket(Long transactionId, Long bucketId) {
        Bucket bucket = bucketService.get(bucketId);
        Transaction transaction = getById(transactionId);
        transaction.assignToBucket(bucket);
        transactionRepository.save(transaction);
        eventPublisher.publishEvent(new TransactionAddedToBucketEvent(transaction, bucket));
        return transaction;
    }

    public Transaction removeBucket(Long transactionId, Long bucketId) {
        Bucket bucket = bucketService.get(bucketId);
        Transaction transaction = getById(transactionId);
        transaction.removeFromBucket();
        transactionRepository.save(transaction);
        eventPublisher.publishEvent(new TransactionRemovedFromBucketEvent(transaction, bucket));
        return transaction;
    }

    @EventListener
    public void handleBucketDeletedEvent(BucketDeletedEvent event) {
        Bucket bucket = event.getBucket();
        transactionRepository.deleteAllByBucket(bucket);
    }



}