import test from 'tape';
import { createStore } from '../modules';
import * as Effects from '../modules/effects';


test('store state is setted to one from initial loop', (t) => {
  t.plan(1);


  const init = {
    state: 1,
    effects: []
  };

  const reducer = (state, action) => {
    return { state, effects: [] };
  }

  const store = createStore(reducer, init);

  t.equal(store.getState(), 1);
});


test('effects within initial loop get dispatched', (t) => {
  t.plan(1);

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

  const reducer = (state, action) => {
    switch (action.type) {
      case ACTION:
        return { state: state + action.arg, effects: [] };
      default:
        return { state, effects: [] };
    }
  }

  const store = createStore(reducer, init);

  setTimeout(() => {
    t.equal(store.getState(), 4);
  }, 10);
});


test('effects returned by the loop get dispatched', (t) => {
  t.plan(1);

  const FIRST_ACTION = 'FIRST_ACTION';
  const SECOND_ACTION = 'SECOND_ACTION';

  const init = {
    state: 1,
    effects: [
      Effects.fromLazyPromise(() => 
        Promise
          .resolve()
          .then(() => ({ type: FIRST_ACTION, foo: 3 }))
      )
    ]
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case FIRST_ACTION:
        return {
          state: state + action.foo,
          effects: [
            Effects.fromLazyPromise(() => 
              Promise
                .resolve()
                .then(() => ({ type: SECOND_ACTION, bar: 1 }))
            )
          ]
        };
      case SECOND_ACTION:
        return {
          state: state + action.bar,
          effects: []
        };
      default:
        return { state, effects: [] };
    }
  }

  const store = createStore(reducer, init);

  setTimeout(() => {
    t.equal(store.getState(), 5);
  }, 10);
});


test('Effects.map works', (t) => {
  t.plan(1);

  const childEffect = Effects.fromLazyPromise(() => Promise.resolve({ type: 'child' }));
  const parentEffect = Effects.map(childEffect, (action) => ({
    type: 'parent',
    nested: action,
  }))

  Effects.toPromise(parentEffect)
    .then((action) => {
      t.deepEqual(
        action,
        {
          type: 'parent',
          nested: {
            type: 'child',
          },
        },
        'the action takes the proper shape for a lifted action'
      );
    });
});
