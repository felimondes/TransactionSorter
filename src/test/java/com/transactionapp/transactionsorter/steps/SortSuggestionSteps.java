package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.TransactionCategorizationService.CategoryScore;
import com.transactionapp.transactionsorter.TransactionCategorizationService.TransactionCategorizationService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
@SpringBootTest
public class SortSuggestionSteps {

    TransactionService transactionService;
    BucketService bucketService;
    TransactionCategorizationService transactionCategorizationService;
    private String category;
    Bucket bucket;
    public SortSuggestionSteps(TransactionService  transactionService,
                               BucketService bucketService,
                               TransactionCategorizationService transactionCategorizationService) {
        this.bucketService = bucketService;
        this.transactionService = transactionService;
        this.transactionCategorizationService = transactionCategorizationService;
    }


    public Bucket sortTransactionsToABucket(String description, String bucketName) {
        Bucket bucket = bucketService.createBucket(bucketName);
        int numberOfTransactions = 5;
        for (int i = 0; i < numberOfTransactions; i++) {
            int randomSuffix = (int) (Math.random() * 1000);
            String randomASCII = String.valueOf((char) (Math.random() * 26 + 'a'));
            String transactionName = description + " " +  randomSuffix + " " + randomASCII;
            Transaction transaction = transactionService.createTransaction(transactionName);
            bucketService.addTransaction(bucket.getId(), transaction.getId());
        }
        return bucket;
    }

    @Given("that i previously sorted multiple transactions with the description containing the word {string} in the bucket labeled {string}")
    public void previouslyISortedMultipleTransactionsWithTheDescriptionInTheBucketLabeled(String description, String bucketName) {
       bucket = sortTransactionsToABucket(description, bucketName);
    }


    @Then("i get a suggestion to put the transaction in the bucket labeled {string}")
    public void iGetASuggestionToPutTheTransactionInTheBucketLabeled(String arg0) {
            assertEquals(arg0, category);
    }

    @When("i ask for suggestions on the transaction containing {string} in the description")
    public void iAskForSuggestionsOnWhereToPutATransactionContainingInTheDescription(String arg0) {
        Transaction transaction = transactionService.createTransaction("hello " + arg0 );

        try {
            CategoryScore categoryScore = transactionCategorizationService.categorize(transaction.getDescription());
            this.category = categoryScore.category();
        } catch (Exception e) {
            this.category = "No suggestion";
        }

    }

    @When("i ask for suggestions on where to put a transaction that resembles no previous transactions")
    public void iAskForSuggestionsOnWhereToPutATransactionThatResemblesNoPreviousTransactions() {
        Transaction transaction = transactionService.createTransaction("A" + Math.random() * 1000);
        try {
            CategoryScore categoryScore = transactionCategorizationService.categorize(transaction.getDescription());
            this.category = categoryScore.category();
        } catch (Exception e) {
            this.category = "No suggestion";
        }

    }

    @And("i delete the bucket labeled {string}")
    public void iDeleteTheBucketLabeled(String arg0) {
        bucketService.deleteBucket(bucket.getId());
    }

    @And("also sorted multiple transactions with the description containing the word {string} in a different bucket labeled {string}")
    public void alsoSortedMultipleTransactionsWithTheDescriptionContainingTheWordInADifferentBucketLabeled(String description, String bucketName) {
        sortTransactionsToABucket(description, bucketName);
    }

    @When("i delete the first bucket")
    public void iDeleteTheFirstBucket() {
        bucketService.deleteBucket(bucket.getId());
    }
}
