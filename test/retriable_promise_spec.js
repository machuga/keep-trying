import { expect } from 'chai';
import keepTrying from '../dist/index';

describe('Retrying a promise', function() {
  it('will only run promise creator once when resolved', function() {
    let counter = 0;
    const makePromise = function() {
      return new Promise(function(resolve, reject) {
        resolve(++counter);
      });
    };

    return keepTrying(makePromise).then(function(count) {
      expect(count).to.equal(1);
    });
  });

  it('will retry till the promise resolves within attempt range', function() {
    let counter = 0;
    const makePromise = function() {
      return new Promise(function(resolve, reject) {
        counter++;
        if (counter <= 1) {
          reject(new Error('Rejected'));
        } else {
          resolve(counter);
        }
      });
    };

    return keepTrying(makePromise, { backoff: 1, max: 3 }).then(function(count) {
      expect(count).to.equal(2);
    });
  });

  it('will give up retrying after the max number of attempts', function() {
    let counter = 0;
    const makePromise = function() {
      return new Promise(function(resolve, reject) {
        counter++;
        reject(new Error(`Rejected: ${counter}`));
      });
    };

    return keepTrying(makePromise, { backoff: 1, max: 3 }).catch(function(count) {
      expect(counter).to.equal(3);
    });
  });

  it('will log retries when logger is provided', function() {
    let logCount = 0;
    let counter = 0;
    let logger = function(err) { logCount++; };
    const makePromise = function() {
      return new Promise(function(resolve, reject) {
        counter++;
        reject(new Error(`Rejected: ${counter}`));
      });
    };

    return keepTrying(makePromise, { backoff: 1, max: 3, logger }).catch(function(count) {
      expect(counter).to.equal(logCount);
    });
  });

  it('will always reject the documentation example', function() {
    // Create a function that wraps a promise and accepts 0 arguments
    const promiseReturningFn = function() {
      return new Promise(function(resolve, reject) {
        const somethingWentWrong = true;
        if (somethingWentWrong) {
          reject(new Error("Something went wrong"));
        } else {
          resolve("Yay!");
        }
      });
    };

    // Try to resolve the promise from our function up to 3 times
    // Uses a backoff of 10ms, multipled by the number of the attempt.
    // 150ms is the default, but this example is used in the tests so
    // keeping it fast here is good.
    keepTrying(promiseReturningFn, { max: 3, backoff: 10 }).then(function(msg) {
      console.log("The promise succeeded!", msg);
    }).catch(function(err) {
      console.debug('The promise failed after all 3 attempts :(');
      console.error(err);

      // Rethrow the error if you'd like
      throw err;
    }).catch(function(err) {
      expect(err).to.be.an('error');
    });
  });
});

