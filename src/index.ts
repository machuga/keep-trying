type PromiseFunction<T> = (...args: any[]) => Promise<T>
interface Options {
  backoff?: number;
  max?: number;
  logger?: any;
  //logger?(message: string | Error): any;
};

const keepTrying = (fn: PromiseFunction<any>, { backoff = 150, max = 5, logger = null } : Options = {}): Promise<any> => {
  const retry = (attempt = 1): Promise<any> => {
    return fn().catch((err) => {
      if (logger) {
        logger(new Error(`Failed on attempt ${attempt} of ${max}: ${err.message}`));
      }

      if (attempt < max) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            resolve(retry(attempt + 1));
          }, attempt * backoff);
        });
      } else {
        throw err;
      }
    });
  }

  return retry();
};
export default keepTrying;
