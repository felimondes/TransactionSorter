package com.transactionapp.transactionsorter.TokenBanService;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class TokenBan {
    @Id
    private String token;

    public TokenBan (String token) {
        this.token = token;

    }
    public TokenBan () {

    }
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
