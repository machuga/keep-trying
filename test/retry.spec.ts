import { expect } from 'chai';
import keepTrying, { RetryStatus } from '../src/index';

describe('Retrying a promise', function() {
  it('run promise creator once when resolved first try', function() {
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

  it('retries till the promise resolves within attempt range', function() {
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

    return keepTrying(makePromise, { backoffStrategy: 'exact', baseTime: 1, maxAttempts: 3 })
      .then(function (count) {
        expect(count).to.equal(2);
      });
  });

  it('gives up retrying after the max number of attempts', function() {
    let counter = 0;
    const makePromise = function() {
      return new Promise(function(resolve, reject) {
        counter++;
        reject(new Error(`Rejected: ${counter}`));
      });
    };

    return keepTrying(makePromise, { backoffStrategy: 'exact', baseTime: 1, maxAttempts: 3 })
      .then(() => {
        throw new Error('Something went wrong in test');
      })
      .catch(function (count) {
        expect(counter).to.equal(3);
      });
  });

  describe('logging', function () {
    const makePromise = (state : any) => function () {
      return new Promise(function (resolve, reject) {
        state.counter++;
        reject(new Error(`Rejected: ${state.counter}`));
      });
    };

    const generateRetry = (state: any, logger: any) =>
      keepTrying(makePromise(state), { backoffStrategy: 'exact', baseTime: 1, maxAttempts: 3, logger });

    it('logs retries when logger is provided', function () {
      const state : any = {
        logCount: 0,
        counter: 0
      };
      const logger = function (status : RetryStatus) { state.logCount++; };

      return generateRetry(state, logger)
        .catch(function (count) {
          expect(state.counter).to.equal(state.logCount);
        });
    });

    it('logger receives status updates', function () {
      const state : any = {
        logCount: 0,
        counter: 0
      };
      const statuses : any = [];
      const logger = function (status : RetryStatus) {
        statuses.push(status);
      };

      return generateRetry(state, logger)
        .catch(function (count) {
          expect(statuses).to.have.lengthOf(3);
          expect(statuses.map((s : RetryStatus) => s.state)).to.deep.equal(['retrying', 'retrying', 'failed']);
        });
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
    keepTrying(promiseReturningFn, { backoffStrategy: 'exact', maxAttempts: 3, baseTime: 1 }).then(function(msg) {
    }).catch(function(err) {

      // Rethrow the error if you'd like
      throw err;
    }).catch(function(err) {
      expect(err).to.be.an('error');
    });
  });

  describe('backoff and jitter', function () {
    const makePromise = (state: any) => () =>
      new Promise(function (resolve, reject) {
        state.times.push(new Date().getTime());
        reject(new Error(`Rejected: ${state.counter}`));
      });

    it('exponential strategies increase expontentially', function() {
      const state: any = {
        times: [],
        statuses: []
      };
      const logger = function (status: RetryStatus) {
        state.statuses.push(status);
      };

      return keepTrying(makePromise(state), { backoffStrategy: 'exponential', jitterStrategy: 'none', baseTime: 10, maxAttempts: 5, logger })
        .catch(e => {
          const times = state.statuses.map((s: RetryStatus) => s.nextAttemptIn).filter(Boolean)
          expect(times).to.eql([20, 40, 80, 160]);
        });
    });

    it('increases roughly exponentially with jitter', function() {
      const state: any = {
        times: [],
        statuses: []
      };
      const logger = function (status: RetryStatus) {
        state.statuses.push(status);
      };

      return keepTrying(makePromise(state), { backoffStrategy: 'exponential', jitterStrategy: 'equal', baseTime: 10, maxAttempts: 5, logger })
      .then(() => {
        throw new Error('uh oh');
      })
        .catch(e => {
          const times = state.statuses.map((s: RetryStatus) => s.nextAttemptIn).filter(Boolean)
          expect(times).to.not.eql([20, 40, 80, 160]);
          times.forEach((time: number, index: number) => {
            if (index === 0) { return; }
            expect(times[index]).to.be.greaterThan(times[index - 1]);
          });
        });
    });
  });
});
