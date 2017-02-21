import { expect } from 'chai';
import * as Redux from 'redux';

import { createStore, Effects } from '../modules';


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

      const store = createStore(reducer, init);

      expect(store.getState()).to.be.equal(1);
    });

    it('should dispatch effects within inital state', done => {
      const ACTION = 'ACTION';

      const init = {
        state: 1,
        effects: [
          Effects.fromLazyPromise(() => 
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

      const store = createStore(reducer, init);

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
          Effects.fromLazyPromise(() => 
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
                Effects.fromLazyPromise(() => 
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

      const store = createStore(reducer, init);

      setTimeout(() => {
        expect(store.getState()).to.be.equal(18);
        done();
      }, EXPECT_TIMEOUT);
    });
  });

  describe('Effects', () => {
    it('#toPromise should throw if wrongly created', () => {
      const effect = Effects.fromLazyPromise(() => 'hello' as any);

      expect(effect.toPromise).to.throw(Error);
    });

    it('#map should transform actions', () => {
      const childEffect = Effects.fromLazyPromise(() => Promise.resolve({ type: 'child' }));
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