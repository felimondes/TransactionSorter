package com.transactionapp.transactionsorter.SuggestionService;


import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/categorizer")
public class SuggestionController {
    private final SuggestionService service;
    public SuggestionController(SuggestionService service) {
        this.service = service;
    }
    @GetMapping("/{description}")
    public SuggestionScore categorize(@PathVariable String description) {
        return service.categorize(description);
    }

    @DeleteMapping("/all")
    public void deleteAllSuggestions() {
        service.deleteAllSuggestions();
    }
}
