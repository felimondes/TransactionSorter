package com.transactionapp.client.apis;

import com.transactionapp.client.dummyobjects.Bucket;
import com.transactionapp.client.dummyobjects.Transaction;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class BucketService {

    private final RestTemplate restTemplate;
    private static final String BASE_URL = "http://localhost:8080/buckets";

    public BucketService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<Bucket> getAllBuckets() {
        try {
            Bucket[] buckets = restTemplate.getForObject(BASE_URL, Bucket[].class);
            return buckets != null ? Arrays.asList(buckets) : Collections.emptyList();
        } catch (Exception e) {
            System.err.println("Failed to fetch buckets: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public Bucket createBucket(String name) {
        try {
            String url = BASE_URL + "?name=" + name;
            return restTemplate.postForObject(url, null, Bucket.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create bucket: " + e.getMessage(), e);
        }
    }

    public List<Transaction> deleteBucket(Long bucketId) {
        try {
            String url = BASE_URL + "/" + bucketId;
            ResponseEntity<Transaction[]> response = restTemplate.exchange(url, HttpMethod.DELETE, null, Transaction[].class);
            Transaction[] transactions = response.getBody();
            return transactions != null ? Arrays.asList(transactions) : Collections.emptyList();
        } catch (HttpClientErrorException.NotFound e) {
            System.err.println("Bucket not found: " + bucketId);
            return Collections.emptyList();
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete bucket: " + e.getMessage(), e);
        }
    }

    public Transaction addTransaction(Long bucketId, Long transactionId) throws RuntimeException{
        try {
            String url = BASE_URL + "/" + bucketId + "/transactions/" + transactionId;
            return restTemplate.postForObject(url, null, Transaction.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to add transaction: " + e.getMessage(), e);
        }
    }

    public Transaction removeTransaction(Long bucketId, Long transactionId) {
        try {
            String url = BASE_URL + "/" + bucketId + "/transactions/" + transactionId;
            restTemplate.delete(url);
            return null;
        } catch (Exception e) {
            throw new RuntimeException("Failed to remove transaction: " + e.getMessage(), e);
        }
    }

    public List<Transaction> getTransactionsInBucket(Long bucketId) {
        try {
            String url = BASE_URL + "/" + bucketId + "/transactions";
            Transaction[] transactions = restTemplate.getForObject(url, Transaction[].class);
            return transactions != null ? Arrays.asList(transactions) : Collections.emptyList();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get transactions in bucket: " + e.getMessage(), e);
        }
    }
}