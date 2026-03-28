package com.transactionapp.transactionsorter.TransactionParserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/transactions")
class TransactionParserController {

    private final TransactionParserService parserService;

    public TransactionParserController(TransactionParserService parserService) {
        this.parserService = parserService;
    }
    @PostMapping("/upload/{month}")
    public ResponseEntity<?> uploadTransactions( @PathVariable int month,
            @RequestParam("file") MultipartFile file) {
            parserService.upload(file, month);
            return ResponseEntity.ok("Transactions imported successfully");
    }
}
