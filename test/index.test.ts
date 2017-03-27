import { expect } from 'chai';
import * as Redux from 'redux';

import { createLoopStore, effect } from '../modules';


const EXPECT_TIMEOUT = 20;

describe('Suit', () => {
  describe('createStore', () => {
    it('should set store to inital state provided', () => {
      const init = {
        state: 1,
        effects: []
      };

      const reducer = (state: number, action: Redux.Action) => {
        return { state, effects: [] };
      }

      const store = createLoopStore(reducer, init);

      expect(store.getState()).to.be.equal(1);
    });

    it('should dispatch effects within inital state', done => {
      const ACTION = 'ACTION';

      const init = {
        state: 1,
        effects: [
          effect(() =>
            Promise
              .resolve()
              .then(() => ({ type: ACTION, arg: 3 }))
          )
        ]
      };

      const reducer = (state: number, action: Redux.Action) => {
        switch (action.type) {
          case ACTION:
            return { state: state + 10, effects: [] };
          default:
            return { state, effects: [] };
        }
      }

      const store = createLoopStore(reducer, init);

      setTimeout(() => {
        expect(store.getState()).to.be.equal(11);
        done();
      }, EXPECT_TIMEOUT);
    });

    it('should dispatch effects returned by reducer', done => {
      const FIRST_ACTION = 'FIRST_ACTION';
      const SECOND_ACTION = 'SECOND_ACTION';

      const init = {
        state: 1,
        effects: [
          effect(() =>
            Promise
              .resolve()
              .then(() => ({ type: FIRST_ACTION }))
          )
        ]
      };

      const reducer = (state: number, action: Redux.Action) => {
        switch (action.type) {
          case FIRST_ACTION:
            return {
              state: state + 5,
              effects: [
                effect(() =>
                  Promise
                    .resolve()
                    .then(() => ({ type: SECOND_ACTION }))
                )
              ]
            };
          case SECOND_ACTION:
            return {
              state: state * 3,
              effects: []
            };
          default:
            return { state, effects: [] };
        }
      }

      const store = createLoopStore(reducer, init);

      setTimeout(() => {
        expect(store.getState()).to.be.equal(18);
        done();
      }, EXPECT_TIMEOUT);
    });
  });

  describe('Effects', () => {
    it('#equals should recognize the same function', () => {
      const fn = () => Promise.resolve({ type: 'action' });
      const left = effect(fn);
      const right = effect(fn);
      expect(left.equals(right)).to.be.true;
    });

    it('#equals should recognize different functions', () => {
      const left = effect(() => Promise.resolve({ type: 'left'}));
      const right = effect(() => Promise.resolve({ type: 'right'}));
      expect(left.equals(right)).to.be.false;
    });

    it('#toPromise should throw if wrongly created', () => {
      const subject = effect(() => 'hello' as any);

      expect(subject.toPromise).to.throw(Error);
    });

    it('#map should transform actions', () => {
      const childEffect = effect(() => Promise.resolve({ type: 'child' }));
      const parentEffect = childEffect.map(action => ({
        type: 'parent',
        nested: action,
      }))

      return parentEffect
        .toPromise()
        .then((action) => {
          expect(action).to.be.deep.equal(
            {
              type: 'parent',
              nested: {
                type: 'child',
              },
            },
          );
        });
    });
  });
});
