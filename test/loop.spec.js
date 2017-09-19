import {isLoop, getCmd, getModel, loop, liftState} from '../src/loop';
import Cmd from '../src/cmd';

describe('loop functions', () => {
  describe('isLoop', () => {
    it('returns true if the param is a 2 item array with the second item a Cmd (and not the first)', () => {
      let item = ['abc', Cmd.action({type: 'hi'})];
      expect(isLoop(item)).toBe(true);
    });

    it('returns false if the item is not an array, length is not 2, item 1 is a Cmd, or item 2 is not', () => {
      let item = 'abc';
      expect(isLoop(item)).toBe(false);

      item = ['abc', Cmd.action({type: 'hi'}), 123];
      expect(isLoop(item)).toBe(false);

      item = [Cmd.action({type: 'hi'}), Cmd.action({type: 'hi'})];
      expect(isLoop(item)).toBe(false);

      item = ['abc', 'abc'];
      expect(isLoop(item)).toBe(false);
    });
  });

  describe('getCmd', () => {
    it('returns the second item in the array if the item is a loop', () => {
      let cmd = Cmd.action({type: 'hi'});
      let item = ['abc', cmd];
      expect(getCmd(item)).toBe(cmd);
    });

    it('returns null if the item is not a loop', () => {
      let cmd = Cmd.action({type: 'hi'});
      let item = ['abc', cmd, 123];
      expect(getCmd(item)).toBe(null);
    });
  });

  describe('getModel', () => {
    it('returns the first item in the array if the item is a loop', () => {
      let item = ['abc', Cmd.action({type: 'hi'})];
      expect(getModel(item)).toBe('abc');
    });

    it('returns the item itself if the item is not a loop', () => {
      let item = ['abc', Cmd.action({type: 'hi'}), 123];
      expect(getModel(item)).toBe(item);
    });
  });

  describe('loop', () => {
    it('returns a loop object (2 item array [model, cmd])', () => {
      let cmd = Cmd.action({type: 'hi'});
      expect(loop('abc', cmd)).toEqual(['abc', cmd]);
    });
  });

  describe('liftState', () => {
    it('returns the item itself if it is a loop', () => {
      let item = loop('abc', Cmd.action({type: 'hi'}));
      expect(liftState(item)).toBe(item);
    });

    it('returns the item in a loop with a Cmd.none cmd', () => {
      let item = 'abc';
      expect(liftState(item)).toEqual(loop('abc', Cmd.none));
    });
  });
});
