package com.transactionapp.transactionsorter.HardRuleService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.HardRuleException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionCreatedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class HardRuleService {

    HardRuleRepository repository;
    BucketService bucketService;
    public  HardRuleService(HardRuleRepository hardRuleRepository, BucketService bucketService) {
        this.bucketService = bucketService;
        this.repository = hardRuleRepository;
    }

    public void createHardRule(Long bucketId, String description) {
        Bucket bucket = bucketService.getBucket(bucketId);
        repository.save(new HardRule(description, bucket));
    }

    @EventListener
    public void enforce(TransactionCreatedEvent event){
        //Transaction
        Transaction transaction = event.transaction();
        String description = transaction.getDescription();

        //Bucket
        Optional<HardRule> hardRule = repository.findByDescription(description);
        if (hardRule.isEmpty()) {
            return;
        }
        Bucket bucket = hardRule.get().getBucket();
        bucketService.addTransaction(bucket.getId(), transaction.getId());
    }

    public void removeHardRule(String description) {
        HardRule hardRule = repository.findByDescription(description)
                .orElseThrow(() -> new HardRuleException("Hard rule not found for description: " + description));
        repository.delete(hardRule);

    }
}
