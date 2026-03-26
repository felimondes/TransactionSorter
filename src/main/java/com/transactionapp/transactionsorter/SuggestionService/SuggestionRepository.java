package com.transactionapp.transactionsorter.SuggestionService;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SuggestionRepository extends JpaRepository<Suggestion, SuggestionId> {

    List<Suggestion> findById_Token(String idToken);


    // Atomic learn (increment or insert) - H2 MERGE (keeps compatibility)
    @Modifying
    @Query("UPDATE Suggestion t SET t.count = t.count + :delta, t.lastUpdated = :now WHERE t.id.bucketId = :bucketId AND t.id.token = :token")
    int incrementCount(@Param("bucketId") Long bucketId,
                       @Param("token") String token,
                       @Param("delta") int delta,
                       @Param("now") LocalDateTime now);

    @Modifying
    @Query(value = """
        MERGE INTO suggestion (bucket_id, token, category, count, last_updated)
        KEY(bucket_id, token)
        VALUES (:bucketId, :token, :category, 1, CURRENT_TIMESTAMP)
        """, nativeQuery = true)
    void upsertLearn(@Param("bucketId") Long bucketId,
                     @Param("token") String token,
                     @Param("category") String category);


    // Atomic unlearn (decrement, delete if count <= 0)
    @Modifying
    @Query(value = """
        UPDATE suggestion
        SET count = count - 1, last_updated = CURRENT_TIMESTAMP
        WHERE bucket_id = :bucketId AND token = :token;

        DELETE FROM suggestion
        WHERE bucket_id = :bucketId AND token = :token AND count <= 0;
        """, nativeQuery = true)
    void atomicUnlearn(@Param("bucketId") Long bucketId,
                       @Param("token") String token);
}