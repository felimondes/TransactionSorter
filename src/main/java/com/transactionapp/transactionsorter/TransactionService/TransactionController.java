package com.transactionapp.transactionsorter.TransactionService;


import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/{id}")
    public Transaction getById(@PathVariable Long id) {
        return transactionService.getById(id);
    }

    @PostMapping
    public Transaction create(@RequestBody TransactionCreationRequest request) {

        return transactionService.create(request);
    }

    @GetMapping
    public List<Transaction> getUnsorted() {
        return transactionService.getUnsorted();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        transactionService.delete(id);
    }


    @GetMapping("/all")
    public List<Transaction> getAll() {
        return transactionService.getAll();
    }


    @GetMapping("/bucket/{bucketId}")
    public List<Transaction> getByBucket(@PathVariable Long bucketId) {
        return transactionService.getByBucket(bucketId);
    }

    @PostMapping("/{transactionId}")
    public Transaction updateData(
            @PathVariable Long transactionId,
            @RequestBody TransactionUpdateRequest request
    ) {
        return transactionService.updateData(transactionId, request);
    }
    @PostMapping("/{transactionId}/bucket/{bucketId}")
    public Transaction assignBucket(
            @PathVariable Long transactionId,
            @PathVariable Long bucketId
    ) {
        return transactionService.assignBucket(transactionId, bucketId);
    }

    @DeleteMapping("/{transactionId}/bucket/{bucketId}")
    public Transaction removeBucket(
            @PathVariable Long transactionId,
            @PathVariable Long bucketId
    ) {
        return transactionService.removeBucket(transactionId, bucketId);
    }
}