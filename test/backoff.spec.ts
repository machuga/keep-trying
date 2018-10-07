import { expect } from 'chai';
import { BackoffStrategy, choose } from '../src/backoff';

describe('Backoff strategies', function() {
  describe('#choose', function () {
    it('returns function given', function () {
      const fn: BackoffStrategy = () => 42;

      expect(choose(fn)).to.equal(fn);
    });

    it('returns valid strategy when requested', function() {
      const subject = choose('exact');
      expect(subject).to.be.a('function');
      expect(subject(42)).to.eql(42);
    });

    it('returns undefined when invalid strategy requested', function() {
      // @ts-ignore - testing for JS
      expect(choose('foo')).to.equal(undefined);
    });
  });
});
