package com.transactionapp.transactionsorter.ArithmeticsService;

import com.transactionapp.transactionsorter.TransactionService.Transaction;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/arithmetics")
public class ArithmeticController {
    private final ArithmeticService service;

    public ArithmeticController(ArithmeticService arithmeticService) {
        this.service = arithmeticService;
    }

    @PostMapping("/{transactionId}")
    public Transaction applyExpression(@RequestBody String expression, @PathVariable Long transactionId) {
        return service.applyExpression(transactionId, expression);
    }
}
