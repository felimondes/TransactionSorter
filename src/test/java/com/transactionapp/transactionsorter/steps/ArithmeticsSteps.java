package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.ArithmeticsService.ArithmeticService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionCreationRequest;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ArithmeticsSteps {

    private final ArithmeticService arithmeticService;
    private final TransactionService transactionService;
    private Transaction transaction;
    private Transaction resultTransaction;


    public ArithmeticsSteps(ArithmeticService arithmeticService, TransactionService transactionService) {
        this.arithmeticService = arithmeticService;
        this.transactionService = transactionService;
    }

    @Given("I have a transaction T with amount {string}")
    public void iHaveATransactionTWithAmount(String arg0) {
        transaction = transactionService.create(new TransactionCreationRequest("Test", LocalDate.now(), new BigDecimal(arg0)));

    }

    @When("I apply the expression {string}")
    public void iApplyTheExpression(String arg0) {
        resultTransaction = arithmeticService.applyExpression(transaction.getId(), arg0);
    }

    @Then("the resulting amount should be {string}")
    public void theResultingAmountShouldBe(String arg0) {
        assertEquals(resultTransaction.getAmount(), new BigDecimal(arg0));

    }
}
