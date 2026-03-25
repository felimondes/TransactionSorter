package com.transactionapp.transactionsorter.TransactionCategorizationService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.TransactionAddedToBucketEvent;
import com.transactionapp.transactionsorter.BucketService.TransactionRemovedFromBucketEvent;
import com.transactionapp.transactionsorter.ErrorHandling.CategorizationException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.context.event.EventListener;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TransactionCategorizationService {

    private final TokenCategoryStatRepository repository;

    public TransactionCategorizationService(TokenCategoryStatRepository repository) {
        this.repository = repository;
    }

    public CategoryScore categorize(String description) {
        List<String> tokens = extractTokens(description);

        Map<String, Double> scores = new HashMap<>();
        Map<String, Long> keyToBucketId = new HashMap<>();

        for (String token : tokens) {
            List<TokenCategoryStat> stats = repository.findById_Token(token);

            int total = 0;
            for (TokenCategoryStat stat : stats) {
                total += stat.getCount();
            }

            for (TokenCategoryStat stat : stats) {
                double weight = (total > 0) ? (double) stat.getCount() / total : 0;
                String key = stat.getCategory() + ":" + stat.getBucketId();
                scores.put(key, weight);
                keyToBucketId.put(key, stat.getBucketId());
            }
        }

        CategoryScore best = null;
        for (Map.Entry<String, Double> entry : scores.entrySet()) {
            if (best == null || entry.getValue() > best.score()) {
                String[] parts = entry.getKey().split(":");
                String category = parts[0];
                Long bucketId = keyToBucketId.get(entry.getKey());
                best = new CategoryScore(bucketId, category, entry.getValue());
            }
        }

        if (best == null) {
            throw new CategorizationException("Unable to categorize transaction: " + description);
        }
        return best;
    }




    private String normalize(String input) {
        return input.toLowerCase()
                .replaceAll("\\d+", "")
                .replaceAll("[^a-zæøå ]", "") // keep Danish chars
                .trim();
    }

    private List<String> extractTokens(String description) {
        String normalized = normalize(description);
        String[] tokens = normalized.split("\\s+");
        Set<String> uniqueTokens = new LinkedHashSet<>(); // preserves order
        for (String token : tokens) {
            if (token.length() > 3) {
                uniqueTokens.add(token);
            }
        }
        return new ArrayList<>(uniqueTokens);
    }


    @EventListener
    @Transactional
    public void learn(TransactionAddedToBucketEvent event) {
        Transaction transaction = event.getTransaction();
        Bucket bucket = event.getBucket();
        List<String> tokens = extractTokens(transaction.getDescription());

        for (String token : tokens) {
            TokenCategoryStatId statId = new TokenCategoryStatId(bucket.getId(), token);

            // Fetch existing stat; if missing, create new
            TokenCategoryStat stat = repository.findById(statId)
                    .orElseGet(() -> new TokenCategoryStat(token, bucket));

            // Increment count and update timestamp
            stat.increment();

            // Save changes
            repository.save(stat);
        }
    }


    @EventListener
    @Transactional
    public void unlearn(TransactionRemovedFromBucketEvent event) {
        Transaction transaction = event.getTransaction();
        Bucket bucket = event.getBucket();
        List<String> tokens = extractTokens(transaction.getDescription());

        for (String token : tokens) {
            TokenCategoryStatId statId = new TokenCategoryStatId(bucket.getId(), token);

            repository.findById(statId).ifPresent(stat -> {
                stat.decrement();
                if (stat.getCount() <= 0) {
                    repository.delete(stat);
                } else {
                    repository.save(stat);
                }
            });
        }
    }

    public void cleanupOldTokens() {
        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);

        List<TokenCategoryStat> oldTokens = repository.findAll().stream()
                .filter(stat -> stat.getCount() == 1 && stat.getLastUpdated().isBefore(oneYearAgo))
                .toList();

        repository.deleteAll(oldTokens);

        System.out.println("Cleaned up " + oldTokens.size() + " rare tokens.");
    }
}