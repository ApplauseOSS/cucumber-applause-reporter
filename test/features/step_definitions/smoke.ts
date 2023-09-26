import { Given, IWorld, Then, When } from '@cucumber/cucumber';
import assert from 'assert';

interface CustomWorld extends IWorld {
  today: string;
  target: string;
}

function dayToNumber(day: string): number {
  switch (day.toUpperCase()) {
    case 'SUNDAY':
      return 0;
    case 'MONDAY':
      return 1;
    case 'TUESDAY':
      return 2;
    case 'WEDNESDAY':
      return 3;
    case 'THURSDAY':
      return 4;
    case 'FRIDAY':
      return 5;
    case 'SATURDAY':
      return 6;
    default:
      throw new Error('Invalid day: ' + day);
  }
}

function getDifferenceInDays(today: string, target: string): number {
  const todayInt = dayToNumber(today);
  const targetInt = dayToNumber(target);
  return (targetInt - todayInt + 7) % 7;
}

Given('Today is {string}', function (this: CustomWorld, today: string) {
  this.attach('f1e809859115dde96465a14b4df0f4d1a277f928', {
    fileName: 'sessionId',
    mediaType: 'text/plain',
  });
  this.today = today;
});

When(
  'I ask how many days until {string}',
  function (this: CustomWorld, target: string) {
    this.target = target;
  }
);

Then(
  'I should be told it is {int} days away',
  function (this: CustomWorld, expectedDays: number) {
    assert.strictEqual(
      getDifferenceInDays(this.today, this.target),
      expectedDays
    );
  }
);
