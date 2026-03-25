package com.transactionapp.transactionsorter.TransactionCategorizationService;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TokenCategoryStatId implements Serializable {
    private Long bucketId;
    private String token;

    public TokenCategoryStatId() {}

    public TokenCategoryStatId(Long bucketId, String token) {
        this.bucketId = bucketId;
        this.token = token;
    }

    // Getters and setters
    public Long getBucketId() { return bucketId; }
    public void setBucketId(Long bucketId) { this.bucketId = bucketId; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }


    // hashCode & equals are critical for EmbeddedId!
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TokenCategoryStatId)) return false;
        TokenCategoryStatId that = (TokenCategoryStatId) o;
        return Objects.equals(bucketId, that.bucketId) &&
                Objects.equals(token, that.token);
    }

    @Override
    public int hashCode() {
        return Objects.hash(bucketId, token);
    }



}