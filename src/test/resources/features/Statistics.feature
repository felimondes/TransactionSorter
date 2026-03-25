Feature: As a user i want see statistics about my transactions

Scenario: Given no buckets with transactions
  Given there is no buckets
  When i press statistics
  Then i get an error message that says i have to fill buckets with transactions first

Scenario: Average money spent per month in category
  Given buckets with transactions
  When i press statistics
  Then i see the average money spent per month in each bucket sorted from highest to low

