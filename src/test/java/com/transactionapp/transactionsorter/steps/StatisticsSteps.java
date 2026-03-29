package com.transactionapp.transactionsorter.steps;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.util.*;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.BucketService.BucketUpdateRequest;
import com.transactionapp.transactionsorter.StatisticsService.MonthlyStatistics;
import com.transactionapp.transactionsorter.StatisticsService.StatisticsService;
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
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class StatisticsSteps {

    TransactionService transactionService;
    BucketService bucketService;
    StatisticsService statisticsService;
    Map<Long, BigDecimal> result;
    private Exception e;

    Bucket bucket1;
    Bucket bucket2;
    Bucket bucket3;
    private MonthlyStatistics monthlyStatistics;


    public StatisticsSteps(TransactionService transactionService, BucketService bucketService, StatisticsService statisticsService) {
        this.transactionService = transactionService;
        this.statisticsService = statisticsService;
        this.bucketService = bucketService;
    }

    @After
    public void cleanup() {
        transactionService.getAll().forEach(tx -> transactionService.delete(tx.getId()));
        bucketService.deleteAll();
    }

    public void fillBucket(Bucket bucket, String category, long seed) {
        Random random = new Random(seed);

        Map<String, List<String>> categoryMerchants = Map.of(
                "GROCERIES", List.of("Netto", "Føtex", "Bilka", "Rema 1000", "Kebab House"),
                "ENTERTAINMENT", List.of("Spotify", "Netflix", "Tivoli", "Steam", "WoW Subscription"),
                "TRANSPORT", List.of("DSB", "Bike Repair", "Rejsekort", "Uber", "Gas Station")
        );

        Map<String, int[]> categoryAmountRanges = Map.of(
                "GROCERIES", new int[]{20, 800},
                "ENTERTAINMENT", new int[]{50, 500},
                "TRANSPORT", new int[]{10, 1000}
        );

        List<String> merchants = categoryMerchants.get(category.toUpperCase());
        int[] range = categoryAmountRanges.get(category.toUpperCase());

        if (merchants == null || range == null) {
            throw new IllegalArgumentException("Unknown category: " + category);
        }

        int numberOfTransactions = 10 + random.nextInt(10);
        for (int i = 0; i < numberOfTransactions; i++) {
            LocalDate start = LocalDate.of(2023, 1, 1);
            LocalDate end = LocalDate.of(2023, 3, 31);
            long randomDay = start.toEpochDay() +
                    random.nextInt((int) (end.toEpochDay() - start.toEpochDay()));
            LocalDate randomDate = LocalDate.ofEpochDay(randomDay);

            int euros = range[0] + random.nextInt(range[1] - range[0]);
            int cents = random.nextInt(100);

            BigDecimal amount = BigDecimal.valueOf(euros)
                    .add(BigDecimal.valueOf(cents, 2));

            String merchant = merchants.get(random.nextInt(merchants.size()));

            String[] suffixes = {"", " purchase", " order", " payment"};
            String suffix = suffixes[random.nextInt(suffixes.length)];

            String description = merchant + suffix;

            Transaction transaction = transactionService.create((new TransactionCreationRequest(description, randomDate, amount)));
            //add tags
            List<String> tags = List.of("Shared", "Own");
            TransactionUpdateRequest request = new TransactionUpdateRequest();
            request.updateTag(tags.get(random.nextInt(0,2)));
            transactionService.updateData(transaction.getId(), request);
            transactionService.assignBucket(transaction.getId(), bucket.getId());

        }
    }




    @Then("i get an error message that says i have to fill buckets with transactions first")
    public void iGetAnErrorMessageThatSaysIHaveToFillBucketsWithTransactionsFirst() {
        assertTrue(e.getMessage().contains("No transactions found"));
    }

    @Given("sorted transactions in buckets under the tags {string} and {string}")
    public void sortedTransactionsInBucketsUnderTheTagsAnd(String arg0, String arg1) {
        bucket1 = bucketService.create("GROCERIES");
        bucket2 = bucketService.create("ENTERTAINMENT");
        bucket3 = bucketService.create("TRANSPORT");

        fillBucket(bucket1, "GROCERIES", 12);
        fillBucket(bucket2, "ENTERTAINMENT", 43);
        fillBucket(bucket3, "TRANSPORT", 111);
    }


    @When("i view statistics for month: {int} and year: {int}")
    public void iViewStatisticsForMonthAndYear(int arg0, int arg1) {
        try {
            monthlyStatistics = statisticsService.viewPerMonthAndYear(3, 2023);
        } catch (Exception e) {
            this.e = e;
        }
    }

    @Then("i see sum for each tag {string} and {string}, aswell as the total sum of these tags")
    public void iSeeSumForEachTagAndAswellAsTheTotalSumOfTheseTags(String arg0, String arg1) {
        assertTrue(monthlyStatistics.getTotal().compareTo(BigDecimal.ZERO) > 0);

        Map<String, BigDecimal> byTags = monthlyStatistics.getPerTag();
        assertTrue(byTags.containsKey(arg0));
        assertTrue(byTags.containsKey(arg1));
    }

    @Given("there is no transactions for month: {int} and year: {int}")
    public void thereIsNoTransactionsForMonthAndYear(int arg0, int arg1) {
        //there is none - see @After
    }
}
