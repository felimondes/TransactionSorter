package com.transactionapp.transactionsorter.BucketService;

import com.transactionapp.transactionsorter.ErrorHandling.BucketNotFoundException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BucketService {

    private final BucketRepository bucketRepository;
    private final TransactionService transactionService;
    private final ApplicationEventPublisher eventPublisher;


    public BucketService(BucketRepository bucketRepository,
                         TransactionService transactionService,
                         ApplicationEventPublisher eventPublisher) {
        this.bucketRepository = bucketRepository;
        this.transactionService = transactionService;
        this.eventPublisher = eventPublisher;

    }

    public Bucket createBucket(String name) {
        Bucket bucket = new Bucket(name);
        return bucketRepository.save(bucket);
    }

    // Get all buckets
    public List<Bucket> getAllBuckets() {
        return bucketRepository.findAll();
    }

    // Add transaction to bucket
    @Transactional
    public Transaction addTransaction(Long bucketId, Long transactionId) {
        Bucket bucket = getManagedBucket(bucketId);
        Transaction transaction = transactionService.getTransactionById(transactionId);

        bucket.addTransaction(transaction);
        transactionService.saveTransaction(transaction);

        // Publish event
        eventPublisher.publishEvent(new TransactionAddedToBucketEvent(transaction, bucket));


        return transaction;
    }

    // Remove transaction from bucket
    @Transactional
    public Transaction removeTransaction(Long bucketId, Long transactionId) {
        Bucket bucket = getManagedBucket(bucketId);
        Transaction transaction = transactionService.getTransactionById(transactionId);

        bucket.removeTransaction(transaction);
        transactionService.saveTransaction(transaction);

        // Publish event
        eventPublisher.publishEvent(new TransactionRemovedFromBucketEvent(transaction, bucket));


        return transaction;
    }

    @Transactional
    public List<Transaction> getTransactionsInBucket(Long bucketId) {
        Bucket bucket = getManagedBucket(bucketId);
        return transactionService.getTransactionsByBucket(bucket);
    }

    @Transactional
    public List<Transaction> deleteBucket(Long bucketId) {
        Bucket bucket = getManagedBucket(bucketId);

        List<Transaction> transactions = transactionService.getTransactionsByBucket(bucket);

        transactions.forEach(t -> {
            removeTransaction(bucketId, t.getId());
        });

        bucketRepository.deleteById(bucket.getId());

        return transactions;
    }

    private Bucket getManagedBucket(Long bucketId) {
        return getBucketOrThrow(bucketId);
    }

    @Transactional
    public void deleteAllBuckets() {
        List<Bucket> buckets = bucketRepository.findAll();
        for (Bucket bucket : buckets) {
            deleteBucket(bucket.getId());
        }
    }

    public Bucket getBucket(Long bucketId) {
        return getBucketOrThrow(bucketId);
    }

    public Bucket updateBucket(Long bucketId, BucketUpdateRequest request) {
        Bucket bucket = getBucketOrThrow(bucketId);
        updateName(bucket, bucket.getName());
        updateTag(bucket, request);
        return bucketRepository.save(bucket);
    }

    private void updateTag(Bucket bucket, BucketUpdateRequest request) {
        if (request.isRemoveTag()) {
            bucket.setTag(null);
        } else if (request.getTag() != null) {
            bucket.setTag(request.getTag());
        }
    }

    private void updateName(Bucket bucket, String name) {
        if (name != null) {
            bucket.setName(name);
        }
    }

    private Bucket getBucketOrThrow(Long bucketId) {
        return bucketRepository.findById(bucketId)
                .orElseThrow(() -> new BucketNotFoundException(
                        "Bucket not found with id: " + bucketId));
    }
}