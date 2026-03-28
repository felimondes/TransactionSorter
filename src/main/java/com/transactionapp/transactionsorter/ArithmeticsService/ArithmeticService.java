package com.transactionapp.transactionsorter.ArithmeticsService;

import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import com.transactionapp.transactionsorter.TransactionService.TransactionUpdateRequest;
import net.objecthunter.exp4j.Expression;
import net.objecthunter.exp4j.ExpressionBuilder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static java.lang.Math.abs;
import static java.lang.Math.round;

@Service
public class ArithmeticService {


    private final TransactionService transactionService;

    public ArithmeticService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public Transaction applyExpression(Long transactionId, String expression) {
        Transaction transaction = transactionService.getById(transactionId);
        expression = expression.toLowerCase();
        Expression e = new ExpressionBuilder(expression)
                .variables("t")
                .build()
                .setVariable("t",
                        transaction.getAmount().doubleValue());

        BigDecimal result = BigDecimal.valueOf(round(e.evaluate()));
        result= result.setScale(2, RoundingMode.HALF_UP);

        TransactionUpdateRequest request = new TransactionUpdateRequest();
        request.setAmount(result);
        Transaction transaction1 = transactionService.updateData(transaction.getId(), request);
        return transaction1;
    }
}
