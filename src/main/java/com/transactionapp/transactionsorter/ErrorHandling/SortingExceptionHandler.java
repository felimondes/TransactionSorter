package com.transactionapp.transactionsorter.ErrorHandling;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;


@ControllerAdvice
public class SortingExceptionHandler {

    @ExceptionHandler(BucketNotFoundException.class)
    public ResponseEntity<Map<String,Object>> handleBucketNotFound(BucketNotFoundException ex) {
        Map<String,Object> body = Map.of(
                "timestamp", LocalDateTime.now(),
                "error", ex.getMessage(),
                "status", HttpStatus.NOT_FOUND.value()
        );
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<Map<String,Object>> handleTransactionNotFound(TransactionNotFoundException ex) {
        Map<String,Object> body = Map.of(
                "timestamp", LocalDateTime.now(),
                "error", ex.getMessage(),
                "status", HttpStatus.NOT_FOUND.value()
        );
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(CategorizationException.class)
    public ResponseEntity<Map<String,Object>> handleCategorizationException(CategorizationException ex) {
        Map<String,Object> body = Map.of(
                "timestamp", LocalDateTime.now(),
                "error", ex.getMessage(),
                "status", HttpStatus.NOT_FOUND.value()
        );
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(TransactionParserException.class)
    public ResponseEntity<Map<String,Object>> handleTransactionParserException(TransactionParserException ex) {
        Map<String,Object> body = Map.of(
                "timestamp", LocalDateTime.now(),
                "error", ex.getMessage(),
                "status", HttpStatus.BAD_REQUEST.value()
        );
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(StatisticsException.class)
    public ResponseEntity<Map<String,Object>> handleStatisticsException(StatisticsException ex) {
        Map<String,Object> body = Map.of(
                "timestamp", LocalDateTime.now(),
                "error", ex.getMessage(),
                "status", HttpStatus.BAD_REQUEST.value()
        );
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,Object>> handleBadRequest(IllegalArgumentException ex) {
        Map<String,Object> body = Map.of(
                "timestamp", LocalDateTime.now(),
                "error", ex.getMessage(),
                "status", HttpStatus.BAD_REQUEST.value()
        );
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }






}