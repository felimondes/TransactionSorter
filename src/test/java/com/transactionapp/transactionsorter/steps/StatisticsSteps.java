package com.transactionapp.transactionsorter.steps;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import com.transactionapp.transactionsorter.BucketService.Bucket;
import com.transactionapp.transactionsorter.BucketService.BucketService;
import com.transactionapp.transactionsorter.StatisticsService.StatisticsService;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import io.cucumber.java.Before;
import io.cucumber.java.PendingException;
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
    public StatisticsSteps(TransactionService transactionService, BucketService bucketService, StatisticsService statisticsService) {
        this.transactionService = transactionService;
        this.statisticsService = statisticsService;
        this.bucketService = bucketService;
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
            LocalDate end = LocalDate.of(2023, 12, 31);
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

            Transaction transaction = transactionService.createTransaction(
                    description,
                    randomDate,
                    amount
            );

            bucketService.addTransaction(bucket.getId(), transaction.getId());
        }
    }

    @Given("buckets with transactions")
    public void aBucketsWithTransactions() {
        bucket1 = bucketService.createBucket("GROCERIES");
        bucket2 = bucketService.createBucket("ENTERTAINMENT");
        bucket3 = bucketService.createBucket("TRANSPORT");

        fillBucket(bucket1, "GROCERIES", 42);
        fillBucket(bucket2, "ENTERTAINMENT", 84);
        fillBucket(bucket3, "TRANSPORT", 126);
    }



    @When("i press statistics")
    public void iPressStatistics() {
        try {
            result = statisticsService.getAverageSpentPerMonthByCategory();
        } catch (Exception e) {
            this.e = e;
        }
    }

    @Then("i see the average money spent per month in each bucket sorted from highest to low")
    public void iSeeTheAverageMoneySpentPerMonthInEachBucketSortedFromHighestToLow() {
        BigDecimal avg1 = result.get(bucket1.getId());
        BigDecimal avg2 = result.get(bucket2.getId());
        BigDecimal avg3 = result.get(bucket3.getId());

        assertTrue(avg1.compareTo(BigDecimal.ONE) > 0,
                "Bucket1 average should be > 1, but was " + avg1);
        assertTrue(avg2.compareTo(BigDecimal.ONE) > 0,
                "Bucket2 average should be > 1, but was " + avg2);
        assertTrue(avg3.compareTo(BigDecimal.ONE) > 0,
                "Bucket3 average should be > 1, but was " + avg3);
    }


    @Then("i get an error message that says i have to fill buckets with transactions first")
    public void iGetAnErrorMessageThatSaysIHaveToFillBucketsWithTransactionsFirst() {
        assertTrue(e.getMessage().contains("Fill buckets with transactions to see statistics"));

    }

    @Given("there is no buckets")
    public void thereIsNoBuckets() {
        bucketService.deleteAllBuckets();
    }
}
