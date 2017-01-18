import test from 'tape';
import { install, loop, Effects, combineReducers } from '../modules';
import { effectToPromise } from '../modules/effects';
import { createStore, applyMiddleware, compose } from 'redux';

const finalCreateStore = install()(createStore);

test('a looped action gets dispatched after the action that initiated it is reduced', (t) => {
  t.plan(2);

  const firstAction = { type: 'FIRST_ACTION' };
  const secondAction = { type: 'SECOND_ACTION' };
  const thirdAction = (value) => ({ type: 'THIRD_ACTION', payload: value });

  const initialState = {
    prop1: {
      firstRun: false,
      secondRun: false,
      thirdRun: false,
    },
    prop2: true,
  };

  function doThirdLater(value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(thirdAction(value));
      }, 0);
    });
  }

  function prop1Reducer(state = initialState.prop1, action) {
    switch(action.type) {

    case 'FIRST_ACTION':
      return loop(
        { ...state, firstRun: true },
        Effects.batch([
          Effects.batch([
            Effects.constant(secondAction),
            Effects.none(),
          ]),
          Effects.promise(doThirdLater, 'hello'),
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

  function prop2Reducer(state = initialState.prop2, action) {
    return state;
  }

  const finalReducer = combineReducers({
    prop1: prop1Reducer,
    prop2: prop2Reducer,
  });

  const store = finalCreateStore(finalReducer, initialState);

  const dispatchPromise = store.dispatch(firstAction);
  t.deepEqual(
    store.getState(),
    {
      prop1: {
        firstRun: true,
        secondRun: false,
        thirdRun: false,
      },
      prop2: true,
    },
    'firstRun is set to true in the same tick as firstAction is dispatched'
  );

  dispatchPromise
    .then(() => {
      t.deepEqual(
        store.getState(),
        {
          prop1: {
            firstRun: true,
            secondRun: true,
            thirdRun: 'hello',
          },
          prop2: true,
        },
        'secondRun is set to true and thirdRun is set to \'hello\' once the effects path is completed'
      );
    });
});

test('Effects are proccessed in the order they are recieved', (t) => {
  t.plan(1);

  const reducer = function (state = {}, action) {
    switch (action.type) {
      case 'LOOPED_BEGIN':
        return loop(
          {...state, done: false},
          Effects.constant({type: 'LOOPED_END'})
        )
      case 'LOOPED_END':
        return {...state, done: true};
      default:
        return state
    }
  };

  const store = finalCreateStore(reducer, {});

  let needsToFire = true;
  store.subscribe(function() {
    if (needsToFire) {
      needsToFire = false;
      store.dispatch({type: 'SOME_OTHER_ACTION'});
    }
  });

  const dispatchPromise = store.dispatch({type: 'LOOPED_BEGIN'});
  dispatchPromise.then(function(r) {
    const state = store.getState();
    t.equal(state.done, true);
  });
});

test('Effects.lift', (t) => {
  const lowerAction = (name) => ({ type: 'LOWER', name });
  const upperAction = (arg, action) => ({ type: 'UPPER', arg, action });

  const lowerEffect = Effects.constant(lowerAction('hello'));
  const upperEffect = Effects.lift(lowerEffect, upperAction, 1);

  effectToPromise(upperEffect)
    .then(([action]) => {
      t.deepEqual(
        action,
        {
          type: 'UPPER',
          arg: 1,
          action: {
            type: 'LOWER',
            name: 'hello'
          },
        },
        'the action takes the proper shape for a lifted action'
      );
      t.end();
    });
});

test('Effects.call', (t) => {
  const callAction = (name) => ({ type: 'CALL', name });
  const callEffect = Effects.call(callAction, 'hello');

  effectToPromise(callEffect)
    .then(([action]) => {
      t.deepEqual(
        action,
        { type: 'CALL', name: 'hello' },
        'the action takes the proper shape for a call action'
      );
      t.end();
    });
});
