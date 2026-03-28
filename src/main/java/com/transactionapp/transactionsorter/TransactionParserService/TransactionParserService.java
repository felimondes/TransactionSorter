package com.transactionapp.transactionsorter.TransactionParserService;


import com.transactionapp.transactionsorter.ErrorHandling.TransactionParserException;
import com.transactionapp.transactionsorter.TransactionService.TransactionCreationRequest;
import com.transactionapp.transactionsorter.TransactionService.TransactionService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class TransactionParserService {


    private final TransactionService transactionService;
    public TransactionParserService (TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public void upload(MultipartFile file, int month) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream()))) {

            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                String[] values = line.split(";");
                if (values.length < 3) continue;

                String dateString = values[0].replace("\uFEFF", "").trim();
                LocalDate date = LocalDate.parse(dateString, dateFormatter);
                if (date.getMonthValue() != month) continue;
                String description = values[1].trim();

                String rawAmount = values[2].trim()
                        .replace(".", "")
                        .replace(",", ".");

                BigDecimal amount = new BigDecimal(rawAmount);
    

                transactionService.create((new TransactionCreationRequest(description, date, amount)));
            }

        } catch (IOException e) {
            throw new TransactionParserException("Failed to parse transactions from CSV" + e);
        }
    }
}
