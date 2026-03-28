package com.transactionapp.transactionsorter.TokenBanService;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BanTokenRepository extends JpaRepository<TokenBan,String > {

    TokenBan getTokenBanByToken(String token);
}
