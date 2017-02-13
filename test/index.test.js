import test from 'tape';
import { createStore, Effects } from '../modules';


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
        t.ok(true);
        return { state, effects: [] };
      default:
        return { state, effects: [] };
    }
  }

  const store = createStore(reducer, init);
});


test('effects returned by the loop get dispatched', (t) => {
  t.plan(2);

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

  const reducer = (state, action) => {
    switch (action.type) {
      case FIRST_ACTION:
        t.ok(true);
        return {
          state,
          effects: [
            Effects.fromLazyPromise(() => 
              Promise
                .resolve()
                .then(() => ({ type: SECOND_ACTION }))
            )
          ]
        };
      case SECOND_ACTION:
        t.ok(true);
        return {
          state,
          effects: []
        };
      default:
        return { state, effects: [] };
    }
  }

  const store = createStore(reducer, init);
});


test('Effects#map works', (t) => {
  t.plan(1);

  const childEffect = Effects.fromLazyPromise(() => Promise.resolve({ type: 'child' }));
  const parentEffect = childEffect.map(action => ({
    type: 'parent',
    nested: action,
  }))

  parentEffect
    .toPromise()
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
