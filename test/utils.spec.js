import { flatten, throwInvariant, isPromiseLike } from '../src/utils';

describe('utils', () => {
  describe('flatten', () => {
    it('returns the passed in array flattened a single level', () => {
      let arr = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      expect(flatten(arr)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('throwInvariant', () => {
    it('throws an error with the supplied message if the condition is false', () => {
      expect(() => throwInvariant(false, 'sad panda')).toThrow(
        new Error('sad panda')
      );
    });

    it('does not throw an error if the condition is true', () => {
      expect(() => throwInvariant(true, 'sad panda')).not.toThrow();
    });
  });

  describe('isPromiseLike', () => {
    it('returns true if the item is an object with a then function', () => {
      let p1 = new Promise(() => {});
      let p2 = { then: () => {} };
      expect(isPromiseLike(p1)).toBe(true);
      expect(isPromiseLike(p2)).toBe(true);
    });

    it('returns false if the item is not an object or has no then function', () => {
      let p1 = 'foo';
      let p2 = { wrong: () => {} };
      let p3 = { then: 'abc' };
      expect(isPromiseLike(p1)).toBe(false);
      expect(isPromiseLike(p2)).toBe(false);
      expect(isPromiseLike(p3)).toBe(false);
    });

    it('returns false if the item is null', () => {
      expect(isPromiseLike(null)).toBe(false);
    });
  });
});
