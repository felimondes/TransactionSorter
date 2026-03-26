package com.transactionapp.transactionsorter.HardRuleService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hard-rules")
public class HardRuleController {

    private final HardRuleService hardRuleService;

    public HardRuleController(HardRuleService hardRuleService) {
        this.hardRuleService = hardRuleService;
    }

    // Create a new hard rule
    @PostMapping
    public ResponseEntity<String> createHardRule(@RequestParam Long bucketId,
                                                 @RequestParam String description) {
        hardRuleService.createHardRule(bucketId, description);
        return ResponseEntity.ok("Hard rule created successfully");
    }

    // Remove an existing hard rule by description
    @DeleteMapping
    public ResponseEntity<String> removeHardRule(@RequestParam String description) {
        hardRuleService.removeHardRule(description);
        return ResponseEntity.ok("Hard rule removed successfully");
    }
}