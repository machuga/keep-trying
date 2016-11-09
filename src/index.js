export default function keepTrying(fn, { backoff = 150, max = 5, logger } = {}) {
  function retry(attempt = 1) {
    return fn().catch(function(err) {
      if (logger) {
        logger(new Error(`Failed on attempt ${attempt} of ${max}: ${err.message}`));
      }

      if (attempt < max) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
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

