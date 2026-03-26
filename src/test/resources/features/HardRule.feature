Feature: As a user i want to always put certain transactions in a bucket
Scenario: Add hard rule
  Given a bucket with name "Entertainment"
  And a transaction with description "Netflix 123"
  When i add the transaction to the bucket "Entertainment"
  And add a hard rule between the bucket and the transaction
  When i load a transaction with description "Netflix 123"
  Then it should immediately be added to the bucket  "Entertainment"


Scenario: Remove hard rule
  Given a bucket with name "Entertainment"
  And a transaction with description "Netflix 123"
  When i add the transaction to the bucket "Entertainment"
  And add a hard rule between the bucket and the transaction
  When i load a transaction with description "Netflix 123"
  Then it should immediately be added to the bucket  "Entertainment"
  When i remove the hard rule between the bucket "Entertainment" and the description "Netflix 123"
  And i again load a transaction with description "Netflix 123"
  Then it should not be added to the bucket  "Entertainment"


Scenario: Request to remove non existing hard rule
  When i try to remove hard rule for "Non existing hard rule"
  Then i get an error message "Hard rule not found"

