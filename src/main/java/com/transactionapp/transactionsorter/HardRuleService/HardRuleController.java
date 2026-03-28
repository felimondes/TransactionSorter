package com.transactionapp.transactionsorter.HardRuleService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hard-rules")
public class HardRuleController {

    private final HardRuleService service;

    public HardRuleController(HardRuleService hardRuleService) {
        this.service = hardRuleService;
    }

    // Create a new hard rule
    @PostMapping
    public ResponseEntity<String> create(@RequestParam Long bucketId,
                                         @RequestParam String description) {
        service.create(bucketId, description);
        return ResponseEntity.ok("Hard rule created successfully");
    }

    // Remove an existing hard rule by description
    @DeleteMapping
    public ResponseEntity<String> removeHardRule(@RequestParam String description) {
        service.remove(description);
        return ResponseEntity.ok("Hard rule removed successfully");
    }
}