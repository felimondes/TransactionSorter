Feature: As a user i want see statistics about my transactions

Scenario: See statistics for specific month and year for all tags
  Given sorted transactions in buckets under the tags "Shared" and "Own"
  When i view statistics for month: 3 and year: 2023
  Then i see sum for each tag "Shared" and "Own", aswell as the total sum of these tags

Scenario: Given no buckets with transactions
  Given there is no transactions for month: 3 and year: 2023
  When i view statistics for month: 3 and year: 2023
  Then i get an error message that says i have to fill buckets with transactions first
