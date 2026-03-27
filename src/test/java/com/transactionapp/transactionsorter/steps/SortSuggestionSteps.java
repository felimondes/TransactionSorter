package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.BucketService.TransactionAddedToBucketEvent;
import com.transactionapp.transactionsorter.SuggestionService.SuggestionScore;
import com.transactionapp.transactionsorter.SuggestionService.SuggestionService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;

import io.cucumber.java.After;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class SortSuggestionSteps {

    TransactionService transactionService;
    BucketService bucketService;
    SuggestionService suggestionService;
    private String category;
    Bucket bucket;
    public SortSuggestionSteps(TransactionService  transactionService,
                               BucketService bucketService,
                               SuggestionService transactionCategorizationService) {
        this.bucketService = bucketService;
        this.transactionService = transactionService;
        this.suggestionService = transactionCategorizationService;
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

    @After
    public void cleanup() {
        transactionService.getAllTransactions().forEach(tx -> transactionService.deleteTransaction(tx.getId()));
        bucketService.deleteAllBuckets();
        suggestionService.deleteAllSuggestions();

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
            SuggestionScore categoryScore = suggestionService.categorize(transaction.getDescription());
            this.category = categoryScore.category();
        } catch (Exception e) {
            this.category = "No suggestion";
        }

    }

    @When("i ask for suggestions on a completly new transaction")
    public void iAskForSuggestionsOnWhereToPutATransactionThatResemblesNoPreviousTransactions() {
        Transaction transaction = transactionService.createTransaction("A" + Math.random() * 1000);
        try {
            SuggestionScore categoryScore = suggestionService.categorize(transaction.getDescription());
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

    @Then("its fine")
    public void itsFine() {
        bucketService.createBucket("Test bucket");

        Transaction tx1 = transactionService.createTransaction("fotex purchase");
        Transaction tx2 = transactionService.createTransaction("fotex purchase");

        try {
            Runnable task1 = () -> suggestionService.learn(new TransactionAddedToBucketEvent(tx1, bucket));
            Runnable task2 = () -> suggestionService.learn(new TransactionAddedToBucketEvent(tx2, bucket));

            Thread t1 = new Thread(task1);
            Thread t2 = new Thread(task2);

            t1.start();
            t2.start();

            t1.join();
            t2.join();
        } catch (Exception e) {
            fail();
        }
    }
}
