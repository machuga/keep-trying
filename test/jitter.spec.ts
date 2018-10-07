import { expect } from 'chai';
import { JitterStrategy, choose } from '../src/jitter';

describe('Jitter strategies', function() {
  describe('#choose', function () {
    it('returns function given', function () {
      const fn: JitterStrategy = () => 42;

      expect(choose(fn)).to.equal(fn);
    });

    it('returns valid strategy when requested', function() {
      const subject = choose('equal');

      expect(subject).to.be.a('function');
    });

    it('returns undefined when invalid strategy requested', function () {
      // @ts-ignore - testing for JS
      expect(choose('foo')).to.equal(undefined);
    });

    it('returns jitter within range', function () {
      const strategy = choose('equal');
      let subject;

      for (let i = 0; i < 100; ++i) {
        subject = strategy(40);
        expect(subject).to.be.within(20, 40);
      }
    });
  });
});
