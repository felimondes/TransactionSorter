Feature: : As a user i want to ban certain tokens from influencing the suggestions given to me

  Scenario: Ban a token
    Given that i have sorted a transaction with the description "Notanr" in "bucket1"
    And a unsorted transaction with description "Notanr"
    When i ban "Notanr"
    Then there is no suggestion of the unsorted transaction

  Scenario: Removing a ban
    Given that i have sorted a transaction with the description "Notanr" in "bucket1"
    And a unsorted transaction with description "Notanr"
    When i ban "Notanr"
    Then there is no suggestion of the unsorted transaction
    When i unban "Notanr"
    Then there is a suggestion of the unsorted transaction to "bucket1"



