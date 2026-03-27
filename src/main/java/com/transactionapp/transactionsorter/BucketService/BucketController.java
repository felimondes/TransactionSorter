package com.transactionapp.transactionsorter.BucketService;
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
    public void deleteBucket(@PathVariable Long bucketId) {
        bucketService.deleteBucket(bucketId);
    }

    @GetMapping("/{bucketId}")
    public Bucket getBucket(@PathVariable Long bucketId) {
        return bucketService.getBucket(bucketId);
    }

    @PostMapping("/{bucketId}")
    public Bucket updateBucket(@PathVariable Long bucketId, @RequestBody BucketUpdateRequest request) {
        return bucketService.updateBucket(bucketId, request);
    }

}