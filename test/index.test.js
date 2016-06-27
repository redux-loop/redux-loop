import test from 'tape';
import { install, loop, Cmd, combineReducers } from '../modules';
import { effectToPromise } from '../modules/effects';
import { createStore, applyMiddleware, compose } from 'redux';

const finalCreateStore = install()(createStore);

test('a looped action gets dispatched after the action that initiated it is reduced', (t) => {
  t.plan(2)

  const firstAction = { type: 'FIRST_ACTION' }
  const secondAction = { type: 'SECOND_ACTION' }
  const thirdAction = (value) => ({ type: 'THIRD_ACTION', payload: value })

  const initialState = {
    prop1: {
      firstRun: false,
      secondRun: false,
      thirdRun: false,
    },
    prop2: true,
  }

  function doThirdLater(value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(value)
      }, 0)
    })
  }

  function prop1Reducer(state = initialState.prop1, action) {
    switch(action.type) {

    case 'FIRST_ACTION':
      return loop(
        { ...state, firstRun: true },
        Cmd.batch([
          Cmd.batch([
            Cmd.constant(secondAction),
            Cmd.none,
          ]),
          Cmd.promise(doThirdLater, thirdAction, undefined, 'hello'),
        ])
      )

    case 'SECOND_ACTION':
      return { ...state, secondRun: true };

    case 'THIRD_ACTION':
      return { ...state, thirdRun: action.payload };

    default:
      return state;
    }
  }

  function prop2Reducer(state = initialState.prop2, action) {
    return state
  }

  const finalReducer = combineReducers({
    prop1: prop1Reducer,
    prop2: prop2Reducer,
  })

  const store = finalCreateStore(finalReducer, initialState)

  const dispatchPromise = store.dispatch(firstAction)
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
  )

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
      )
    })
})
