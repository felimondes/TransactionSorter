package com.transactionapp.transactionsorter.HardRuleService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.HardRuleException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionCreatedEvent;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class HardRuleService {

    private final HardRuleRepository repository;
    private final BucketService bucketService;
    private final TransactionService transactionService;

    public  HardRuleService(HardRuleRepository hardRuleRepository, BucketService bucketService, TransactionService transactionService) {
        this.bucketService = bucketService;
        this.repository = hardRuleRepository;
        this.transactionService = transactionService;
    }

    public void create(Long bucketId, String description) {
        Bucket bucket = bucketService.get(bucketId);
        repository.save(new HardRule(description, bucket));
    }

    public void remove(String description) {
        HardRule hardRule = repository.findByDescription(description)
                .orElseThrow(() -> new HardRuleException("Hard rule not found for description: " + description));
        repository.delete(hardRule);

    }
    @EventListener
    public void enforce(TransactionCreatedEvent event){
        Transaction transaction = event.transaction();
        String description = transaction.getDescription();

        Optional<HardRule> hardRule = repository.findByDescription(description);
        if (hardRule.isEmpty()) {
            return;
        }
        Bucket bucket = hardRule.get().getBucket();
        transactionService.assignBucket(transaction.getId(), bucket.getId());
    }

}
