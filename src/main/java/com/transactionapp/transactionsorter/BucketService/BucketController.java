package com.transactionapp.transactionsorter.BucketService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/buckets")
public class BucketController {

    private final BucketService service;

    public BucketController(BucketService bucketService) {
        this.service = bucketService;
    }


    @PostMapping
    public Bucket create(@RequestParam String name) {
        return service.create(name);
    }

    @GetMapping
    public List<Bucket> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{bucketId}")
    public void delete(@PathVariable Long bucketId) {
        service.delete(bucketId);
    }

    @GetMapping("/{bucketId}")
    public Bucket get(@PathVariable Long bucketId) {
        return service.get(bucketId);
    }

    @PostMapping("/{bucketId}")
    public Bucket updateData(@PathVariable Long bucketId, @RequestBody BucketUpdateRequest request) {
        return service.updateData(bucketId, request);
    }
    @DeleteMapping("/all")
    public void deleteAll() {
        service.deleteAll();
    }
}