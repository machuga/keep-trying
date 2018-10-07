export interface BackoffStrategy {
  (base: number, attempt?: number, maxTime?: number): number;
}

interface BackoffMap {
  exact: BackoffStrategy;
  linear: BackoffStrategy;
  exponential: BackoffStrategy;
}

export type BackoffType = keyof BackoffMap | BackoffStrategy;

export const strategies : BackoffMap = {
  exact: (value: number) => value,
  linear: (base : number, attempt : number = 1) => base * attempt,
  exponential: (base: number, attempt: number = 1, maxTime: number = 3000) => Math.min(maxTime, base * 2 ** attempt)
};

export const choose = (strategy : BackoffType) : BackoffStrategy => {
  if (typeof strategy === 'function') {
    return strategy
  }

  return strategies[strategy];
};
