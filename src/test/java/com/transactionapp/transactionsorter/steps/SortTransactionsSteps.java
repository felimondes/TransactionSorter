package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.BucketService.BucketUpdateRequest;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionCreationRequest;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import com.transactionapp.transactionsorter.TransactionService.TransactionUpdateRequest;
import io.cucumber.java.After;
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
        transactionService.getAll().forEach(tx -> transactionService.delete(tx.getId()));
        bucketService.deleteAll();
    }

    public SortTransactionsSteps(BucketService bucketService, TransactionService transactionService) {
        this.bucketService = bucketService;
        this.transactionService = transactionService;
    }


    @Given("a transaction")
    public void aTransactionWithSomeInformation() {
        Transaction transaction = transactionService.
                create((new TransactionCreationRequest("Netto", LocalDate.parse("1999-01-01"), new BigDecimal("100.00"))));
        transactionId = transaction.getId();
    }

    @And("a bucket with a name")
    public void aBucketWithAName() {
        Bucket bucket = bucketService.create("Netto");
        bucketId = bucket.getId();
    }


    @When("i add the transaction to the bucket")
    public void iAddTheBucketTransactionToTheBucket() {
        try {
            transactionService.assignBucket(transactionId, bucketId);
        } catch (Exception e) {
            this.e = e;
        }
    }

    @Then("the transaction is in the bucket")
    public void theTransactionIsInTheBucket() {
        Transaction transactionInBucket = transactionService.getByBucket(bucketId).getFirst();
        assertEquals(transactionId, transactionInBucket.getId());
    }


    @And("remove the transaction from the bucket")
    public void removeTheTransactionFromTheBucket() {;
        transactionService.removeBucket(transactionId, bucketId);
    }

    @Then("the transaction is not in the bucket")
    public void theTransactionIsNotInTheBucket() {
        assertTrue(transactionService.getByBucket(bucketId).isEmpty());
    }

    @And("delete the bucket")
    public void deleteTheBucket() {
        bucketService.delete(bucketId);
        boolean exists = bucketService.getAll()
                .stream()
                .anyMatch(b -> b.getId().equals(bucketId));
        assertFalse(exists);
    }

    @Then("the transaction is not in any buckets")
    public void theTransactionIsNotAssociatedWithAnyBuckets() {
        Transaction foundTransaction = transactionService.getById(transactionId);
        List<Transaction> transactions = transactionService.getUnsorted();
        for (Transaction transaction : transactions) {
            if (transaction.getId().equals(foundTransaction.getId())) {
                assertTrue(true);
                return;
            }
        }
        fail();
    }


    @When("i change the id of the transaction to a fake id")
    public void iChangeTheIdOfTheTransactionToAFakeId() {
        transactionId = 999L;
    }

    @Then("i get an error saying \"not found\"")
    public void iGetAnErrorThatTheTransactionDoesNotExist() {
        assertTrue(e.getMessage().contains("not found"));
    }



    @Then("i see the transaction in unsorted transactions")
    public void iSeeTheTransaction() {
        List<Transaction> unsortedTransactions = transactionService.getUnsorted();

        boolean found = unsortedTransactions.stream()
                .anyMatch(t -> t.getId().equals(transactionId));
        assertTrue(found);
    }

    @When("i delete the transaction")
    public void iDeleteTheTransaction() {
        transactionService.delete(transactionId);
    }

    @Then("i do not see the transaction in my unsorted transactions")
    public void iDoNotSeeTheTransactionInMyUnsortedTransactions() {
        List<Transaction> unsortedTransactions = transactionService.getUnsorted();
        boolean found = unsortedTransactions.stream()
                .anyMatch(t -> t.getId().equals(transactionId));
        assertFalse(found);
    }


    @When("i create a transaction with description {string}, date {string} and amount {string}")
    public void iCreateATransactionWithDescriptionDateAndAmount(String arg0, String arg1, String arg2) {
        Transaction transaction = transactionService.create((new TransactionCreationRequest(arg0, LocalDate.parse(arg1), new BigDecimal(arg2))));
        transactionId = transaction.getId();
    }

    @Then("a date of creation attribute is added to it")
    public void aDateOfCreationAttributeIsAddedToIt() {
        Transaction transaction = transactionService.getById(transactionId);
        assertEquals(LocalDate.now(), transaction.getCreationDate());
    }


    @When("i add the tag {string} to the transaction")
    public void iAddTheTagToTheTransaction(String arg0) {
        TransactionUpdateRequest request = new TransactionUpdateRequest();
        request.setTag(arg0);
        transactionService.updateData(transactionId, request);
    }

    @Then("the tag {string} is added to the transaction")
    public void theTagIsAddedToTheTransaction(String arg0) {
        Transaction transaction = transactionService.getById(transactionId);
        assertEquals(arg0, transaction.getTag());
    }

    @When("i remove the tag")
    public void iRemoveTheTag() {
        TransactionUpdateRequest request = new TransactionUpdateRequest();
        request.markRemoveTag();
        transactionService.updateData(transactionId, request);
    }

    @Then("it is not longer on the the transaction")
    public void itIsNotLongerOnTheTheTransaction() {
        Transaction transaction = transactionService.getById(transactionId);
        assertNull(transaction.getTag());

    }
}
