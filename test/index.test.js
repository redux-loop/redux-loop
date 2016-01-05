import test from 'tape';
import { installReduxLoop, loop } from '../src';
import { createStore, applyMiddleware, compose } from 'redux';

const finalCreateStore = installReduxLoop()(createStore);

test('a looped action gets dispatched after the action that initiated it is reduced', (t) => {

  t.plan(2);

  const firstAction = { type: 'FIRST_ACTION' };
  const secondAction = { type: 'SECOND_ACTION' };
  const initialState = { firstRun: false, secondRun: false };

  function reducer(state, action) {
    switch(action.type) {

    case 'FIRST_ACTION':
      return loop(
        { ...state, firstRun: true },
        Promise.resolve(secondAction)
      );

    case 'SECOND_ACTION':
      return { ...state, secondRun: true };

    default:
      return state;
    }
  }

  const store = finalCreateStore(reducer, initialState);

  const dispatchPromise = store.dispatch(firstAction);
  t.deepEqual(store.getState(), { firstRun: true, secondRun: false });

  dispatchPromise
    .then(() => {
      t.deepEqual(store.getState(), { firstRun: true, secondRun: true });
    });

});
