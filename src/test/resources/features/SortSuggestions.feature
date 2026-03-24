Feature: As a user i want suggestion on where to put unsorted transactions based on my previous sortings
    Scenario: Suggestion based on nothing
        When i ask for suggestions on where to put a transaction that resembles no previous transactions
        Then i get a suggestion to put the transaction in the bucket labeled "No suggestion"

    Scenario: Suggestion based on previous sortings
        Given that i previously sorted multiple transactions with the description containing the word "Netto" in the bucket labeled "Groceries"
        When i ask for suggestions on the transaction containing "Netto" in the description
        Then i get a suggestion to put the transaction in the bucket labeled "Groceries"

    Scenario: Deleting a bucket removes suggestions for that bucket
        Given that i previously sorted multiple transactions with the description containing the word "Spotify" in the bucket labeled "Entertainment"
        And i delete the bucket labeled "Entertainment"
        When i ask for suggestions on the transaction containing "Spotify" in the description
        Then i get a suggestion to put the transaction in the bucket labeled "No suggestion"

    Scenario: Buckets with same name. Bucket is linked through ID and not name.
        Given that i previously sorted multiple transactions with the description containing the word "DSB" in the bucket labeled "Bucket"
        And also sorted multiple transactions with the description containing the word "Cykel" in a different bucket labeled "Bucket"
        When i delete the first bucket
        And i ask for suggestions on the transaction containing "DSB" in the description
        Then i get a suggestion to put the transaction in the bucket labeled "No suggestion"
        When i ask for suggestions on the transaction containing "Cykel" in the description
        Then i get a suggestion to put the transaction in the bucket labeled "Bucket"




