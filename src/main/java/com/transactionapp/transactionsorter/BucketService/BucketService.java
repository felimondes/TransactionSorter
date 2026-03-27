package com.transactionapp.transactionsorter.BucketService;

import com.transactionapp.transactionsorter.ErrorHandling.BucketNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BucketService {

    private final BucketRepository bucketRepository;
    private final ApplicationEventPublisher eventPublisher;


    public BucketService(BucketRepository bucketRepository, ApplicationEventPublisher eventPublisher) {
        this.bucketRepository = bucketRepository;
        this.eventPublisher = eventPublisher;
    }

    public Bucket createBucket(String name) {
        Bucket bucket = new Bucket(name);
        return bucketRepository.save(bucket);
    }

    public Bucket getBucket(Long id) {
        return bucketRepository.findById(id)
                .orElseThrow(() -> new BucketNotFoundException("Bucket not found: " + id));
    }

    public List<Bucket> getAllBuckets() {
        return bucketRepository.findAll();
    }

    public Bucket updateBucket(Long id, BucketUpdateRequest request) {
        Bucket bucket = getBucket(id);
        bucket.updateName(request.getName());

        if (request.isRemoveTag()) {
            bucket.setTag(null);
        } else if (request.getTag() !=null) {
            bucket.setTag(request.getTag());
        }
        return bucketRepository.save(bucket);
    }

    @Transactional
    public void deleteBucket(Long bucketId) {
        Bucket bucket = getBucket(bucketId);
        bucketRepository.delete(bucket);
        eventPublisher.publishEvent(new BucketDeletedEvent(this, bucket));
    }

    @Transactional
    public void deleteAllBuckets() {
        for (Bucket bucket : bucketRepository.findAll()) {
            deleteBucket(bucket.getId());
        }
    }
}