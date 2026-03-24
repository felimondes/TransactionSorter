package com.transactionapp.transactionsorter.BucketService;

import com.transactionapp.transactionsorter.ErrorHandling.BucketNotFoundException;
import com.transactionapp.transactionsorter.ErrorHandling.TransactionNotFoundException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BucketService {

    private final BucketRepository bucketRepository;
    private final TransactionRepository transactionRepository;

    public BucketService(BucketRepository bucketRepository,
                         TransactionRepository transactionRepository) {
        this.bucketRepository = bucketRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public List<Transaction> deleteBucket(Long bucketId) {
        Bucket bucket = getManagedBucket(bucketId);

        List<Transaction> transactions = transactionRepository.getTransactionByBucket(bucket);
        transactionRepository.removeBucketFromTransactions(bucket.getId());
        bucketRepository.deleteById(bucket.getId());

        transactions.forEach(t -> t.setBucket(null));
        return transactions;
    }

    @Transactional
    public Transaction addTransaction(Long bucketId, Long transactionId) {
        Bucket bucket = getManagedBucket(bucketId);
        Transaction transaction = getManagedTransaction(transactionId);

        bucket.addTransaction(transaction);
        return transaction;
    }

    @Transactional
    public Transaction removeTransaction(Long bucketId, Long transactionId) {
        Bucket bucket = getManagedBucket(bucketId);
        Transaction transaction = getManagedTransaction(transactionId);

        bucket.removeTransaction(transaction);
        return transaction;
    }

    public Bucket createBucket(String name) {
        Bucket bucket = new Bucket(name);
        return bucketRepository.save(bucket);
    }

    @Transactional
    public List<Transaction> getTransactionsInBucket(Long bucketId) {
        Bucket bucket = getManagedBucket(bucketId);
        return transactionRepository.getTransactionByBucket(bucket);
    }


    public List<Bucket> getAllBuckets() {
        return bucketRepository.findAll();
    }

    private Bucket getManagedBucket(Long bucketId) {
        return bucketRepository.findById(bucketId)
                .orElseThrow(() -> new BucketNotFoundException(
                        "Bucket not found with id: " + bucketId));
    }


    private Transaction getManagedTransaction(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Transaction not found with id: " + transactionId));
    }
}


