package com.transactionapp.transactionsorter.BucketService;

import com.transactionapp.transactionsorter.BucketService.events.BucketDeletedEvent;
import com.transactionapp.transactionsorter.ErrorHandling.BucketNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BucketService {

    private final BucketRepository repository;
    private final ApplicationEventPublisher eventPublisher;


    public BucketService(BucketRepository bucketRepository, ApplicationEventPublisher eventPublisher) {
        this.repository = bucketRepository;
        this.eventPublisher = eventPublisher;
    }

    public Bucket create(String name) {
        Bucket bucket = new Bucket(name);
        return repository.save(bucket);
    }

    public Bucket get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new BucketNotFoundException("Bucket not found: " + id));
    }

    public List<Bucket> getAll() {
        return repository.findAll();
    }

    public Bucket updateData(Long id, BucketUpdateRequest request) {
        Bucket bucket = get(id);
        bucket.updateName(request.getName());

        if (request.isRemoveTag()) {
            bucket.setTag(null);
        } else if (request.getTag() !=null) {
            bucket.setTag(request.getTag());
        }
        return repository.save(bucket);
    }

    @Transactional
    public void delete(Long bucketId) {
        Bucket bucket = get(bucketId);
        repository.delete(bucket);
        eventPublisher.publishEvent(new BucketDeletedEvent(this, bucket));
    }

    @Transactional
    public void deleteAll() {
        for (Bucket bucket : repository.findAll()) {
            delete(bucket.getId());
        }
    }
}