const randomInt = (max : number) : number =>  Math.floor(Math.random() * Math.floor(max));

export interface JitterStrategy {
  (value: number) : number;
}

interface JitterMap {
  none: JitterStrategy;
  full: JitterStrategy;
  equal: JitterStrategy;
}

export type JitterType = keyof JitterMap | JitterStrategy;

export const strategies: JitterMap = {
  none: (time: number) : number => time,
  full: (time: number) => randomInt(time),
  equal: (time: number): number => {
    const halvedBackoff = time / 2;

    return halvedBackoff + randomInt(halvedBackoff);
  }
};

export const choose = (strategy: JitterType) : JitterStrategy => {
  if (typeof strategy === 'function') {
    return strategy
  }

  return strategies[strategy];
};
