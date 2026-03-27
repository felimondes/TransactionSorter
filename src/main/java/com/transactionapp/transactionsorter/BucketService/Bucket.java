package com.transactionapp.transactionsorter.BucketService;


import com.transactionapp.transactionsorter.HardRuleService.HardRule;
import com.transactionapp.transactionsorter.SuggestionService.Suggestion;
import com.transactionapp.transactionsorter.TransactionService.Transaction;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
public class Bucket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "bucket")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<Transaction> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "bucket", cascade = CascadeType.ALL)
    private List<Suggestion> tokenStats = new ArrayList<>();

    @OneToMany(mappedBy = "bucket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HardRule> hardRules;

    private String name;
    private String tag;

    public Bucket(String name) {
        this.name = name;
    }

    public void addTransaction(Transaction transaction) {
        transactions.add(transaction);
        transaction.setBucket(this);
    }
    public void removeTransaction(Transaction transaction) {
        transactions.remove(transaction);
        transaction.setBucket(null);
    }


    protected Bucket(){
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    @PostPersist
    public void prePersist() {
        System.out.println("Bucket with ID " + id + " persisted");
    }
    @PostUpdate
    public void postUpdate() {
        System.out.println("Bucket with ID " + id + " updated");
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Bucket that = (Bucket) obj;
        return Objects.equals(that.id, this.id);
    }

    public void setTag(String tag) {
        this.tag = tag;

    }

    public String getTag() {
        return tag;
    }

    public void setName(String name) {
        this.name = name;
    }
}
