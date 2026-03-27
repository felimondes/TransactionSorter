//package com.transactionapp.transactionsorter.steps;
//
//import com.transactionapp.transactionsorter.ArithmeticsService.ArithmeticService;
//import com.transactionapp.transactionsorter.BucketService.Bucket;
//import com.transactionapp.transactionsorter.BucketService.BucketService;
//import com.transactionapp.transactionsorter.TransactionService.Transaction;
//import com.transactionapp.transactionsorter.TransactionService.TransactionCreationRequest;
//import com.transactionapp.transactionsorter.TransactionService.TransactionService;
//import io.cucumber.java.en.Given;
//import io.cucumber.java.en.Then;
//import io.cucumber.java.en.When;
//
//import java.math.BigDecimal;
//
//import static org.junit.jupiter.api.Assertions.assertEquals;
//
//public class ArithmeticsSteps {
//
//    TransactionService transactionService;
//    BucketService bucketService;
//    ArithmeticService arithmeticService;
//    private Transaction transaction;
//
//    Bucket bucket;
//    public ArithmeticsSteps(TransactionService  transactionService,
//                               BucketService bucketService,
//                            ArithmeticService arithmeticService) {
//        this.bucketService = bucketService;
//        this.transactionService = transactionService;
//        this.arithmeticService = arithmeticService;
//    }
//
//
//    @Given("a transaction with description amount {string}")
//    public void aTransactionWithDescriptionAmount(String arg0) {
//        transaction = transactionService.createTransaction((new TransactionCreationRequest(arg0, null, null)));
//    }
//
//    @When("i request to apply {string} to the transaction")
//    public void iRequestToApplyToTheTransaction(String arg0) {
//        transaction = arithmeticService.applyExpression(arg0, transaction);
//
//    }
//
//    @Then("the amount of the transaction is {string}")
//    public void theAmountOfTheTransactionIs(String arg0) {
//        BigDecimal amount = transaction.getAmount();
//        BigDecimal expectedAmount = new BigDecimal(arg0);
//        assertEquals(expectedAmount, amount);
//    }
//}
