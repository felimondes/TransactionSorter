package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.TransactionNotFoundException;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.PendingException;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;


@SpringBootTest
public class SortTransactionsSteps {

    private final BucketService bucketService;
    private final TransactionService transactionService;
    Long transactionId;
    Long bucketId;
    Exception e;

    @After
    public void cleanup() {
        transactionService.getAllTransactions().forEach(tx -> transactionService.deleteTransaction(tx.getId()));
        bucketService.deleteAllBuckets();
    }

    public SortTransactionsSteps(BucketService bucketService, TransactionService transactionService) {
        this.bucketService = bucketService;
        this.transactionService = transactionService;
    }


    @Given("a transaction")
    public void aTransactionWithSomeInformation() {
        Transaction transaction = transactionService.createTransaction("Netto", LocalDate.parse("1999-01-01"), new BigDecimal("100.00"));
        transactionId = transaction.getId();
    }

    @And("a bucket with a name")
    public void aBucketWithAName() {
        Bucket bucket = bucketService.createBucket("Netto");
        bucketId = bucket.getId();
    }


    @When("i add the transaction to the bucket")
    public void iAddTheBucketTransactionToTheBucket() {
        try {
            bucketService.addTransaction(bucketId, transactionId);
        } catch (TransactionNotFoundException e) {
            this.e = e;
        }
    }


    @Then("the transaction is in the bucket")
    public void theTransactionIsInTheBucket() {
        Transaction transactionInBucket = bucketService.getTransactionsInBucket(bucketId).getFirst();
        assertEquals(transactionId, transactionInBucket.getId());
    }


    @And("remove the transaction from the bucket")
    public void removeTheTransactionFromTheBucket() {
        bucketService.removeTransaction(bucketId, transactionId);

    }

    @Then("the transaction is not in the bucket")
    public void theTransactionIsNotInTheBucket() {
        assertTrue(bucketService.getTransactionsInBucket(bucketId).isEmpty());
    }

    @And("delete the bucket")
    public void deleteTheBucket() {

        bucketService.deleteBucket(bucketId);
        boolean exists = bucketService.getAllBuckets()
                .stream()
                .anyMatch(b -> b.getId().equals(bucketId));
        assertFalse(exists);
    }

    @Then("the transaction is not in any buckets")
    public void theTransactionIsNotAssociatedWithAnyBuckets() {
        Transaction foundTransaction = transactionService.getTransactionById(transactionId);
        assertNull(foundTransaction.getBucket());
    }


    @When("i change the id of the transaction to a fake id")
    public void iChangeTheIdOfTheTransactionToAFakeId() {
        transactionId = 999L;
    }

    @Then("i get an error saying \"not found\"")
    public void iGetAnErrorThatTheTransactionDoesNotExist() {
        assertTrue(e instanceof TransactionNotFoundException);
    }



    @Then("i see the transaction in unsorted transactions")
    public void iSeeTheTransaction() {
        List<Transaction> unsortedTransactions = transactionService.getUnsortedTransactions();

        boolean found = unsortedTransactions.stream()
                .anyMatch(t -> t.getId().equals(transactionId));
        assertTrue(found);
    }

    @When("i delete the transaction")
    public void iDeleteTheTransaction() {
        transactionService.deleteTransaction(transactionId);
    }

    @Then("i do not see the transaction in my unsorted transactions")
    public void iDoNotSeeTheTransactionInMyUnsortedTransactions() {
        List<Transaction> unsortedTransactions = transactionService.getUnsortedTransactions();
        boolean found = unsortedTransactions.stream()
                .anyMatch(t -> t.getId().equals(transactionId));
        assertFalse(found);
    }
}
