//package com.transactionapp.transactionsorter.ArithmeticsService;
//
//import com.transactionapp.transactionsorter.TransactionService.Transaction;
//import com.transactionapp.transactionsorter.TransactionService.TransactionService;
//import com.transactionapp.transactionsorter.TransactionService.TransactionUpdateRequest;
//import net.objecthunter.exp4j.Expression;
//import net.objecthunter.exp4j.ExpressionBuilder;
//import org.springframework.stereotype.Service;
//
//import java.math.BigDecimal;
//
//@Service
//public class ArithmeticService {
//
//
//    private final TransactionService transactionService;
//
//    public ArithmeticService(TransactionService transactionService) {
//        this.transactionService = transactionService;
//    }
//
//    public Transaction applyExpression(String expression, Transaction transaction) {
//        Expression e = new ExpressionBuilder(expression)
//                .variables("t")
//                .build()
//                .setVariable("t",
//                        transaction.getAmount().doubleValue());
//
//        BigDecimal result = BigDecimal.valueOf(e.evaluate());
//
//        TransactionUpdateRequest request = new TransactionUpdateRequest();
//        request.setAmount(result);
//        return transactionService.updateTransaction(transaction.getId(), request);
//    }
//}
