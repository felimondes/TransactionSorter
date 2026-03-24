package com.transactionapp.transactionsorter.TransactionCategorizationService;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/categorizer")
public class TransactionCategorizerController {

    private final TransactionCategorizationService service;

    public TransactionCategorizerController(TransactionCategorizationService service) {
        this.service = service;
    }

    @GetMapping("/{description}")
    public CategoryScore categorize(@PathVariable String description) {
        return service.categorize(description);
    }
}
