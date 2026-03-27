package com.transactionapp.transactionsorter.BucketService;

import com.transactionapp.transactionsorter.HardRuleService.HardRule;
import com.transactionapp.transactionsorter.SuggestionService.Suggestion;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Bucket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String tag;

    @OneToMany(mappedBy = "bucket")
    private List<Transaction> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "bucket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Suggestion> tokenStats = new ArrayList<>();

    @OneToMany(mappedBy = "bucket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HardRule> hardRules = new ArrayList<>();

    protected Bucket() {}

    public Bucket(String name) {
        this.name = name;
    }




    public void updateName(String name) {
        if (name != null) this.name = name;

    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getTag() { return tag; }
    public List<Transaction> getTransactions() { return transactions; }
    public List<Suggestion> getTokenStats() { return tokenStats; }
    public List<HardRule> getHardRules() { return hardRules; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Bucket)) return false;
        return id != null && id.equals(((Bucket) o).id);
    }

    @Override
    public int hashCode() {
        return 31;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }
}