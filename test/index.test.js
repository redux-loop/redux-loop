import test from 'tape';
import Loop, { installReduxLoop, loop } from '../src';
import { createStore, applyMiddleware, compose } from 'redux';

const finalCreateStore = installReduxLoop()(createStore);

test('a looped action gets dispatched after the action that initiated it is reduced', (t) => {

  t.plan(2);

  const firstAction = { type: 'FIRST_ACTION' };
  const secondAction = { type: 'SECOND_ACTION' };
  const thirdAction = (value) => ({ type: 'THIRD_ACTION', payload: value });
  const initialState = { firstRun: false, secondRun: false, thirdRun: false };

  function doThirdLater(value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(thirdAction(value));
      }, 0);
    });
  }

  function reducer(state, action) {
    switch(action.type) {

    case 'FIRST_ACTION':
      return loop(
        { ...state, firstRun: true },
        Loop.batch([
          Loop.constant(secondAction),
          Loop.promise(thirdAction, 'hello'),
        ])
      );

    case 'SECOND_ACTION':
      return { ...state, secondRun: true };

    case 'THIRD_ACTION':
      return { ...state, thirdRun: action.payload };

    default:
      return state;
    }
  }

  const store = finalCreateStore(reducer, initialState);

  const dispatchPromise = store.dispatch(firstAction);
  t.deepEqual(store.getState(), {
    firstRun: true,
    secondRun: false,
    thirdRun: false,
  });

  dispatchPromise
    .then(() => {
      t.deepEqual(store.getState(), {
        firstRun: true,
        secondRun: true,
        thirdRun: 'hello',
      });
    });
});
