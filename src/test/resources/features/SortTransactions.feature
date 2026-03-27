Feature: As a user i want to sort my transactions in buckets

  Scenario: Date of creation attribute
    When i create a transaction with description "Netto 123", date "2024-01-01" and amount "100"
    Then a date of creation attribute is added to it

  Scenario: See unsorted transactions
    Given a transaction
    Then i see the transaction in unsorted transactions

  Scenario: Delete a transaction
    Given a transaction
    When i delete the transaction
    Then i do not see the transaction in my unsorted transactions

  Scenario: Add transaction to bucket
    Given a transaction
    And a bucket with a name
    When i add the transaction to the bucket
    Then the transaction is in the bucket
    And i do not see the transaction in my unsorted transactions

  Scenario: Remove transaction from bucket
    Given a transaction
    And a bucket with a name
    When i add the transaction to the bucket
    And remove the transaction from the bucket
    Then the transaction is not in the bucket
    And i see the transaction in unsorted transactions

  Scenario: Delete a bucket containing a transaction
    Given a transaction
    And a bucket with a name
    When i add the transaction to the bucket
    And delete the bucket
    Then the transaction is not in any buckets
    And i see the transaction in unsorted transactions

  Scenario: Adding transaction with fake id to bucket
    Given a transaction
    And a bucket with a name
    When i change the id of the transaction to a fake id
    When i add the transaction to the bucket
    Then i get an error saying "not found"





