package com.transactionapp.transactionsorter.TokenBanService;

import org.apache.catalina.valves.rewrite.InternalRewriteMap;
import org.springframework.stereotype.Service;

@Service
public class BanTokenService {

    private final BanTokenRepository repository;

    public BanTokenService(BanTokenRepository repository) {
        this.repository = repository;
    }

    public TokenBan ban(String token) {
        TokenBan tokenBan = new TokenBan(token.toLowerCase());
        return repository.save(tokenBan);
    }

    public void unban(String token) {
        TokenBan tokenBan = repository.getTokenBanByToken(token);
        repository.delete(tokenBan);
    }

    public boolean isBanned(String token) {
        TokenBan tokenBan = repository.getTokenBanByToken(token);
        return null != tokenBan;
    }

    public void unbanAll() {
        repository.deleteAll();
    }
}
