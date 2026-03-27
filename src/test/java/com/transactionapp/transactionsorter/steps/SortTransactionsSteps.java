package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.BucketService.BucketUpdateRequest;
import com.transactionapp.transactionsorter.ErrorHandling.TransactionNotFoundException;
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
import java.util.Optional;

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
        Transaction transaction = transactionService.
                createTransaction((new TransactionCreationRequest("Netto", LocalDate.parse("1999-01-01"), new BigDecimal("100.00"))));
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
            TransactionUpdateRequest request = new TransactionUpdateRequest();
            request.setBucketId(bucketId);
            transactionService.updateTransaction(transactionId, request);
        } catch (TransactionNotFoundException e) {
            this.e = e;
        }
    }

    @Then("the transaction is in the bucket")
    public void theTransactionIsInTheBucket() {
        Transaction transactionInBucket = transactionService.getTransactionsByBucket(bucketId).getFirst();
        assertEquals(transactionId, transactionInBucket.getId());
    }


    @And("remove the transaction from the bucket")
    public void removeTheTransactionFromTheBucket() {
        TransactionUpdateRequest request = new TransactionUpdateRequest();
        request.setRemoveBucket(true);
        transactionService.updateTransaction(transactionId, request);
    }

    @Then("the transaction is not in the bucket")
    public void theTransactionIsNotInTheBucket() {
        assertTrue(transactionService.getTransactionsByBucket(bucketId).isEmpty());
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


    @When("i create a transaction with description {string}, date {string} and amount {string}")
    public void iCreateATransactionWithDescriptionDateAndAmount(String arg0, String arg1, String arg2) {
        Transaction transaction = transactionService.createTransaction((new TransactionCreationRequest(arg0, LocalDate.parse(arg1), new BigDecimal(arg2))));
        transactionId = transaction.getId();
    }

    @Then("a date of creation attribute is added to it")
    public void aDateOfCreationAttributeIsAddedToIt() {
        Transaction transaction = transactionService.getTransactionById(transactionId);
        assertEquals(LocalDate.now(), transaction.getCreationDate());
    }

    @When("i add the tag {string} to the bucket")
    public void iAddTheTagToTheBucket(String tag) {
        BucketUpdateRequest request = new BucketUpdateRequest();
        request.setTag(tag);
        bucketService.updateBucket(bucketId, request);
    }

    @Then("the tag {string} is added to the bucket")
    public void theTagIsAddedToTheBucket(String arg0) {
        String tag = bucketService.getBucket(bucketId).getTag();
        assertEquals(arg0, tag);
    }

    @When("i remove the tag {string} from the bucket")
    public void iRemoveTheTagFromTheBucket(String arg0) {
        BucketUpdateRequest request = new BucketUpdateRequest();
        request.markRemoveTag();
        bucketService.updateBucket(bucketId, request);
    }

    @Then("the tag {string} is not in the bucket")
    public void theTagIsNotInTheBucket(String arg0) {
        String tag = bucketService.getBucket(bucketId).getTag();
        assertNull(tag);
    }
}
