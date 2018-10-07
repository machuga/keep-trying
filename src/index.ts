import { JitterType, choose as chooseJitter } from './jitter';
import { BackoffType, choose as chooseBackoff } from './backoff';

type PromiseFunction<T> = (...args: any[]) => Promise<T>

interface Options {
  baseTime?: number;
  maxAttempts?: number;
  maxTime?: number;
  backoffStrategy?: BackoffType;
  jitterStrategy?:  JitterType;
  logger?(status: RetryStatus): any;
};

interface Config extends Options {
  baseTime: number;
  maxAttempts: number;
  maxTime: number;
  backoffStrategy: BackoffType;
  jitterStrategy: JitterType;
  logger(status: RetryStatus): any;
}

const noOpLogger = () => {};

const defaults : Config = {
  baseTime: 150,
  maxAttempts: 5,
  maxTime: 5000,
  backoffStrategy: 'exponential',
  jitterStrategy: 'equal',
  logger: noOpLogger
};

export interface RetryStatus {
  attempt: number;
  maxAttempts: number;
  nextAttemptIn?: number;
  state: 'retrying' | 'failed';
  error?: Error;
}

const keepTrying = (fn: PromiseFunction<any>, options : Options = {}): Promise<any> => {
  const jitter = chooseJitter(options.jitterStrategy || defaults.jitterStrategy);
  const backoff = chooseBackoff(options.backoffStrategy || defaults.backoffStrategy);
  const maxAttempts = (typeof options.maxAttempts === 'number') ? options.maxAttempts : defaults.maxAttempts;
  const logger = options.logger || defaults.logger;
  const maxTime = options.maxTime || defaults.maxTime;
  const baseTime = options.baseTime || defaults.baseTime;

  const retry = (attempt = 1): Promise<any> => {
    return fn().catch((err) => {
      if (attempt < maxAttempts) {
        const nextAttemptIn = jitter(backoff(baseTime, attempt, maxTime));

        logger({ attempt, maxAttempts, nextAttemptIn, state: 'retrying', error: err });

        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(retry(attempt + 1));
          }, nextAttemptIn);
        });
      } else {
        logger({ attempt, maxAttempts, state: 'failed', error: err });
        throw err;
      }
    });
  }

  return retry();
};

export default keepTrying;
