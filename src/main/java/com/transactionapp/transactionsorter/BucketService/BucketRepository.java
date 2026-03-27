package com.transactionapp.transactionsorter.BucketService;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BucketRepository extends JpaRepository<Bucket, Long> {
    Bucket findByName(String name);

}
