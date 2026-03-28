package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.SuggestionService.SuggestionScore;
import com.transactionapp.transactionsorter.TokenBanService.BanTokenService;
import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.ErrorHandling.CategorizationException;
import com.transactionapp.transactionsorter.SuggestionService.SuggestionService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionCreationRequest;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import io.cucumber.java.After;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.junit.jupiter.api.Assertions.*;

public class TokenBanSteps {

    private final BanTokenService banTokensService;
    private final TransactionService transactionService;
    private final BucketService bucketService;
    private final SuggestionService suggestionService;


    private Transaction unsortedTransaction;

    public TokenBanSteps(BanTokenService banTokensService, TransactionService transactionService, BucketService bucketService, SuggestionService suggestionService) {
        this.banTokensService = banTokensService;
        this.transactionService = transactionService;
        this.bucketService = bucketService;
        this.suggestionService = suggestionService;
    }

    @After
    public void cleanup() {
        transactionService.getAll().forEach(tx -> transactionService.delete(tx.getId()));
        bucketService.deleteAll();
        banTokensService.unbanAll();
        suggestionService.deleteAll();
    }
    @Given("that i have sorted a transaction with the description {string} in {string}")
    public void thatIHaveSortedTwoTransactionsWithTheDescriptionIn(String arg0, String arg1) {
        Transaction tx1 = transactionService.create(new TransactionCreationRequest(arg0, null, null));
        Transaction tx2 = transactionService.create(new TransactionCreationRequest(arg0, null, null));
        Bucket bucket = bucketService.create(arg1);
        transactionService.assignBucket(tx1.getId(), bucket.getId());
        transactionService.assignBucket(tx2.getId(), bucket.getId());
    }


    @And("a unsorted transaction with description {string}")
    public void aUnsortedTransactionWithDescription(String arg0) {
        unsortedTransaction = transactionService.create(new TransactionCreationRequest(arg0, null, null));

    }

    @When("i ban {string}")
    public void iBlacklist(String arg0) {
        banTokensService.ban(arg0);
    }

    @Then("there is no suggestion of the unsorted transaction")
    public void thereIsNoSuggestionOfTheUnsortedTransaction() {
        try {
            suggestionService.categorize(unsortedTransaction.getDescription());
            fail();
        } catch (Exception e) {
            assertTrue(true);
        }
    }


    @When("i unban {string}")
    public void iUnban(String arg0) {
        banTokensService.unban(arg0.toLowerCase());
    }

    @Then("there is a suggestion of the unsorted transaction to {string}")
    public void thereIsASuggestionOfTheUnsortedTransactionTo(String arg0) {
        SuggestionScore score = suggestionService.categorize(unsortedTransaction.getDescription());
        assertEquals(score.category(), arg0);

    }
}
