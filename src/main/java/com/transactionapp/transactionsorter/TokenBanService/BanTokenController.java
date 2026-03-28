package com.transactionapp.transactionsorter.TokenBanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bans")
public class BanTokenController {

    private final BanTokenService service;

    public BanTokenController(BanTokenService service) {
        this.service = service;
    }
    @PostMapping("/{token}")
    public void ban(@PathVariable String token) {
        service.ban(token);
    }

    @DeleteMapping("/{token}")
    public void unban(@PathVariable String token) {
        service.unban(token);
    }

    @GetMapping("/{token}")
    public boolean isBanned(@PathVariable String token) {
        return service.isBanned(token);
    }

    @DeleteMapping("/all")
    public void unbanAll() {
        service.unbanAll();
    }
}
