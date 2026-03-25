package com.transactionapp.transactionsorter.steps;

import com.transactionapp.transactionsorter.TransactionParserService.TransactionParserService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;


import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class TransactionParserSteps {

    private final TransactionParserService transactionParserService;
    private final TransactionService transactionService;

    public TransactionParserSteps(TransactionParserService transactionParserService, TransactionService transactionService) {
        this.transactionParserService = transactionParserService;
        this.transactionService = transactionService;
    }

    MockMultipartFile file;
    int sizeBefore;
    @Given("a csv with transactions")
    public void aCsvWithTransactions() throws IOException {
        sizeBefore = transactionService.getAllTransactions().size();

        InputStream is = getClass()
                .getClassLoader()
                .getResourceAsStream("transactionsTest.csv");

        file = new MockMultipartFile(
                "file",                        // must match @RequestParam("file")
                "transactionsTest.csv",        // original filename
                "text/csv",
                is
        );
    }

    @When("i import the transactions")
    public void iImportTheTransactions() {
        transactionParserService.uploadTransactions(file, 3);

    }

    @Then("i see the transactions in my unsorted transactions")
    public void iSeeTheTransactionsInMyUnsortedTransactions() {
        List<Transaction> sizeAfter = transactionService.getAllTransactions();
        assertEquals(sizeBefore + 12, sizeAfter.size());

    }
}
