Feature: Smoke

    Scenario: TestRail-1234 Monday to Monday
        Given Today is "Monday"
        When I ask how many days until "Monday"
        Then I should be told it is 0 days away
    Scenario: TestRail-1234 Monday to Tuesday
        Given Today is "Monday"
        When I ask how many days until "Tuesday"
        Then I should be told it is 1 days away
    Scenario: Monday to Wednesday
        Given Today is "Monday"
        When I ask how many days until "Wednesday"
        Then I should be told it is 2 days away
    Scenario: Monday to Thursday
        Given Today is "Monday"
        When I ask how many days until "Thursday"
        Then I should be told it is 3 days away
    Scenario: Monday to Friday
        Given Today is "Monday"
        When I ask how many days until "Friday"
        Then I should be told it is 4 days away
    Scenario: Monday to Saturday
        Given Today is "Monday"
        When I ask how many days until "Saturday"
        Then I should be told it is 5 days away
    Scenario: Monday to Sunday
        Given Today is "Monday"
        When I ask how many days until "Sunday"
        Then I should be told it is 6 days away
    Scenario: Tuesday to Wednesday
        Given Today is "Tuesday"
        When I ask how many days until "Wednesday"
        Then I should be told it is 1 days away
    Scenario: Thursday to Friday
        Given Today is "Tuesday"
        When I ask how many days until "Friday"
        Then I should be told it is 3 days away
    Scenario: Friday to Tuesday
        Given Today is "Friday"
        When I ask how many days until "Tuesday"
        Then I should be told it is 4 days away
    Scenario: Sunday to Saturday
        Given Today is "Sunday"
        When I ask how many days until "Saturday"
        Then I should be told it is 6 days away