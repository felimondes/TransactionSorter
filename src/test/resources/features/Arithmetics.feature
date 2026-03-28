Feature: As a user i want to apply basic math to my transactions
  Scenario: Arbitrary expression on a transaction
    Given I have a transaction T with amount "10"
    When I apply the expression "((T + 10) / (2 * 10)) - 1"
    Then the resulting amount should be "0.00"

  Scenario: Arbitrary expression on a transaction
    Given I have a transaction T with amount "-10"
    When I apply the expression "10+T"
    Then the resulting amount should be "0.00"
