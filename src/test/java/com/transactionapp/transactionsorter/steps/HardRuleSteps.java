package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.HardRuleService.HardRuleService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import io.cucumber.java.After;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class HardRuleSteps {

    BucketService bucketService;
    HardRuleService hardRuleService;
    TransactionService transactionService;
    private Bucket bucket;
    private Transaction transaction;
    private Exception e;
    private String descriptionToBeRemovedFor;
    public HardRuleSteps(HardRuleService hardRuleService, TransactionService transactionService, BucketService bucketService) {
        this.hardRuleService = hardRuleService;
        this.bucketService = bucketService;
        this.transactionService = transactionService;
    }

    @After
    public void cleanup(){
        transactionService.getAllTransactions().forEach(tx -> transactionService.deleteTransaction(tx.getId()));
        bucketService.deleteAllBuckets();
        try {
            hardRuleService.removeHardRule(descriptionToBeRemovedFor);

        } catch (Exception e) {
            // Ignore if the rule was already removed
        }
    }

    @Given("a bucket with name {string}")
    public void aBucketWithName(String arg0) {
        bucket = bucketService.createBucket(arg0);
    }

    @And("a transaction with description {string}")
    public void aTransactionWithDescription(String arg0) {
        transaction = transactionService.createTransaction(arg0);
    }

    @When("i add the transaction to the bucket {string}")
    public void iAddTheTransactionToTheBucket(String arg0) {
        bucketService.addTransaction(bucket.getId(), transaction.getId());
    }

    @And("add a hard rule between the bucket and the transaction")
    public void addAHardRuleBetweenTheBucketAndTheTransaction() {
        hardRuleService.createHardRule(bucket.getId(), transaction.getDescription());
        descriptionToBeRemovedFor = transaction.getDescription();
    }

    @When("i load a transaction with description {string}")
    public void iLoadATransactionWithDescription(String arg0) {
        transactionService.createTransaction(arg0);
    }

    @Then("it should immediately be added to the bucket  {string}")
    public void itShouldImmediatelyBeAddedTo(String arg0) {
        List<Transaction> transactions = bucketService.getTransactionsInBucket(bucket.getId());
        assertEquals(transactions.getFirst().getId(), transaction.getId());
    }


    @When("i remove the hard rule between the bucket {string} and the description {string}")
    public void iRemoveTheHardRuleBetweenTheBucketAndTheDescription(String arg0, String arg1) {
        hardRuleService.removeHardRule(arg1);
        assertEquals(arg0, bucket.getName());
    }

    @Then("it should not be added to the bucket  {string}")
    public void itShouldNotBeAddedToTheBucket(String arg0) {
        List<Transaction> transactions = bucketService.getTransactionsInBucket(bucket.getId());
        assertNotEquals(transactions.getFirst().getId(), transaction.getId());
    }

    @And("i again load a transaction with description {string}")
    public void iAgainLoadATransactionWithDescription(String arg0) {
        transaction = transactionService.createTransaction(arg0);
    }

    @When("i try to remove hard rule for {string}")
    public void iTryToRemoveHardRuleFor(String arg0) {
        try {
            hardRuleService.removeHardRule(arg0);

        } catch (Exception e) {
            this.e = e;
        }
    }

    @Then("i get an error message {string}")
    public void iGetAnErrorMessage(String arg0) {
        assertTrue(e.getMessage().contains(arg0));
    }
}
