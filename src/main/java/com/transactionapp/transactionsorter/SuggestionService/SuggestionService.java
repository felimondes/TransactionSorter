package com.transactionapp.transactionsorter.SuggestionService;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.TokenBanService.BanTokenService;
import com.transactionapp.transactionsorter.TransactionService.events.TransactionAddedToBucketEvent;
import com.transactionapp.transactionsorter.TransactionService.events.TransactionRemovedFromBucketEvent;
import com.transactionapp.transactionsorter.ErrorHandling.CategorizationException;
import org.springframework.stereotype.Service;
import org.springframework.context.event.EventListener;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SuggestionService {

    private final SuggestionRepository repository;
    private final BanTokenService banTokenService;

    public SuggestionService(SuggestionRepository repository, BanTokenService banTokenService) {
        this.repository = repository;
        this.banTokenService = banTokenService;
    }

    public SuggestionScore categorize(String description) {
        List<String> tokens = extractTokens(description);

        Map<String, Double> scores = new HashMap<>();
        Map<String, Long> keyToBucketId = new HashMap<>();

        for (String token : tokens) {

            if (banTokenService.isBanned(token)) {
                continue;
            }
            List<Suggestion> stats = repository.findById_Token(token);

            int total = 0;
            for (Suggestion stat : stats) {
                total += stat.getCount();
            }

            for (Suggestion stat : stats) {
                double weight = (total > 0) ? (double) stat.getCount() / total : 0;
                String key = stat.getCategory() + ":" + stat.getBucketId();
                scores.put(key, weight);
                keyToBucketId.put(key, stat.getBucketId());
            }
        }

        SuggestionScore best = null;
        for (Map.Entry<String, Double> entry : scores.entrySet()) {
            if (best == null || entry.getValue() > best.score()) {
                String[] parts = entry.getKey().split(":");
                String category = parts[0];
                Long bucketId = keyToBucketId.get(entry.getKey());
                best = new SuggestionScore(bucketId, category, entry.getValue());
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
        Bucket bucket = event.getBucket();
        List<String> tokens = extractTokens(event.getTransaction().getDescription());

        //Concurrency problems here UPDATE, CREATE UPDATE
        for (String token : tokens) {
            int updated = repository.incrementCount(bucket.getId(), token, 1, java.time.LocalDateTime.now());
            if (updated == 0) {
                try {
                    repository.upsertLearn(bucket.getId(), token, bucket.getName());
                } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                    int updatedAgain = repository.incrementCount(bucket.getId(), token, 1, java.time.LocalDateTime.now());
                    if (updatedAgain == 0) {
                        throw ex;
                    }
                }
            }
        }
    }

    @EventListener
    @Transactional
    public void unlearn(TransactionRemovedFromBucketEvent event) {
        Bucket bucket = event.getBucket();
        List<String> tokens = extractTokens(event.getTransaction().getDescription());

        for (String token : tokens) {
            repository.atomicUnlearn(bucket.getId(), token);
        }
    }


    public void deleteAll() {
        repository.deleteAll();
    }

    //TODO add functionality
    public void cleanupOldTokens() {
        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);

        List<Suggestion> oldTokens = repository.findAll().stream()
                .filter(stat -> stat.getCount() == 1 && stat.getLastUpdated().isBefore(oneYearAgo))
                .toList();

        repository.deleteAll(oldTokens);

        System.out.println("Cleaned up " + oldTokens.size() + " rare tokens.");
    }
}