import React from 'react';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { isntall, loop, Effects, combineReducers } from 'redux-loop';

const delay = (millis) => new Promise((resolve) =>
  setTimeout(() => resolve(true), millis)
);

const Constants = {
  INCREMENT_COUNTER: 'INCREMENT_COUNTER',
  DECREMENT_COUNTER: 'DECREMENT_COUNTER',
  INCREMENT_IF_ODD:  'INCREMENT_IF_ODD',
  INCREMENT_ASYNC:   'INCREMENT_ASYNC',
};

const Actions = {
  increment:      () => ({ type: Constants.INCREMENT_COUNTER }),
  decrement:      () => ({ type: Constants.DECREMENT_COUNTER }),
  incrementIfOdd: () => ({ type: Constants.INCREMENT_IF_ODD }),
  incrementAsync: (millis = 1000) => ({
    type:    Constants.INCREMENT_ASYNC,
    payload: millis,
  }),
};

const Api = {
  incrementAsync: (millis) => (
    delay(millis).then(Actions.increment)
  )
};

const counter = (state = 0, action) => {
  switch (action.type) {
    case INCREMENT_ASYNC:
      return loop(
        state,
        Effect.promise(Api.incrementAsync, action.payload)
      );

    case INCREMENT_COUNTER:
      return state + 1;

    case DECREMENT_COUNTER:
      return state - 1;

    case INCREMENT_IF_ODD:
      return state % 2 ? state + 1 : state;

    default:
      return state;
  }
};

const reducer = combineReducers({
  counter
});

const Counter = ({ model, dispatch }) => {
  const dispatchAction = (action) => () => dispatch(action());

  return (
    <div>
      <p>
        Clicked: {data.counter} times {' '}
        <button onClick={dispatchAction(Actions.increment)}>+</button> {' '}
        <button onClick={dispatchAction(Actions.decrement)}>-</button> {' '}
        <button onClick={dispatchAction(Actions.incrementIfOdd)}>Increment if odd</button> {' '}
        <button onClick={dispatchAction(Actions.incrementAsync)}>Increment async</button>
      </p>
    </div>
  );
};

const store = install()(createStore)(reducer, { counter: 0 });
const connector = connect((state) => { model: state });
const App = connector(Counter);

render(
  <Provider store={store}>
    <Counter />
  </Provider>
)
