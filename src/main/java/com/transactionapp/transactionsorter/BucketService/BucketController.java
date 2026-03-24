package com.transactionapp.transactionsorter.BucketService;


import com.transactionapp.transactionsorter.TransactionService.Transaction;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/buckets")
public class BucketController {

    private final BucketService bucketService;

    public BucketController(BucketService bucketService) {
        this.bucketService = bucketService;
    }

    @PostMapping
    public Bucket createBucket(@RequestParam String name) {
        return bucketService.createBucket(name);
    }

    @GetMapping
    public List<Bucket> getAllBuckets() {
        return bucketService.getAllBuckets();
    }

    @DeleteMapping("/{bucketId}")
    public List<Transaction> deleteBucket(@PathVariable Long bucketId) {
        return bucketService.deleteBucket(bucketId);
    }

    @PostMapping("/{bucketId}/transactions/{transactionId}")
    public Transaction addTransaction(
            @PathVariable Long bucketId,
            @PathVariable Long transactionId) {
        return bucketService.addTransaction(bucketId, transactionId);
    }

    @DeleteMapping("/{bucketId}/transactions/{transactionId}")
    public Transaction removeTransaction(
            @PathVariable Long bucketId,
            @PathVariable Long transactionId) {
        return bucketService.removeTransaction(bucketId, transactionId);
    }

    @GetMapping("/{bucketId}/transactions")
    public List<Transaction> getTransactionsInBucket(@PathVariable Long bucketId) {
        return bucketService.getTransactionsInBucket(bucketId);
    }
}