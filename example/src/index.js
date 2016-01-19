import React from 'react';
import { render } from 'react-dom';
import { fromJS } from 'immutable';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { createAction, createReducer } from 'redux-act';
import delay from './delay';
import { Effects, loop, install } from '../../';


/**
 * Set up an initial state with two counters that we will update after some
 * variable amount of time after we start the incrementing process. Immutable
 * objects work rather well with redux-loop, and there is not additional setup
 * to be able to use an Immutable.Map as your top level state. Internally,
 * redux-loop makes sure the redux store is satisfied with the shape of your
 * state.
 */
const initialState = fromJS({
  short: {
    loading: false,
    count: 0,
    failed: false,
  },
  long: {
    loading: false,
    count: 0,
    failed: false,
  },
});


/**
 * We're using redux-act (https://github.com/pauldijou/redux-act) to set up
 * some actions here, but this is just because we like it and it lets you add
 * real documentation strings instead of using constants. No special
 * action-creator factories or reducer factories are necessary to use
 * redux-loop. Switch statements are totally fine!
 */
const Actions = {
  incrementBothStart: createAction('Start both increments'),
  shortIncrementStart: createAction('Start short incrememt'),
  shortIncrementSucceed: createAction('Finish short increment'),
  shortIncrementFail: createAction('Fail to complete short increment'),
  longIncrementStart: createAction('Start long increment'),
  longIncrementSucceed: createAction('Finish long increment'),
  longIncrementFail: createAction('Fail to complete long increment'),
};


/**
 * In order to do actual real-world things in your application you'll probably
 * have an API that makes network requests or manages animations or something
 * of that nature. Here we'll just use timeouts to mock up some asynchronous
 * behavior. redux-loop expects that your Promises will always resolve, even if
 * the original API call fails. You'll always want to fill in both the `then`
 * and the `catch` cases with an action creator. In this example, the `delay`
 * function has a roughly 50% chance of rejecting the promise, so we'll handle
 * both cases. If you forget to handle an error case and a Promise passed to
 * redux-loop does get rejected, you'll see an error logged to the console and
 * redux-loop's dispatching will halt.
 */
const Api = {
  shortIncrement: (amount) => (
    delay(10)
      .then(() => Actions.shortIncrementSucceed(amount))
      .catch(() => Actions.shortIncrementFail())
  ),

  longIncrement: (amount) => (
    delay(3000)
      .then(() => Actions.longIncrementSucceed(amount))
      .catch(() => Actions.longIncrementFail())
  )
};


/**
 * In your reducer you can choose to return a loop or not. The typical pattern
 * you'll end up using is to have some sort of `__Start` action that feeds into
 * one or more pairs of `__Succeed` and `__Fail` actions. You must always handle
 * the failure case, even if the handler is a no-op!
 */
const reducer = createReducer({

  /**
   * The following three reducers start through the process of updating the
   * counter on the short timer. The process starts here and can either fail
   * or succeed randomly, and we've covered both cases.
   */
  [Actions.shortIncrementStart]: (state, amount) => loop(
    state
      .setIn(['short', 'loading'], true)
      .setIn(['short', 'failed'], false),
    Effects.promise(Api.shortIncrement, amount)
  ),

  [Actions.shortIncrementSucceed]: (state, amount) => (
    state
      .setIn(['short', 'loading'], false)
      .updateIn(['short', 'count'], (current) => current + amount)
  ),

  [Actions.shortIncrementFail]: (state) => (
    state
      .setIn(['short', 'loading'], false)
      .setIn(['short', 'failed'], true)
  ),

  /**
   * The following three reducers perform the same such behavior for the counter
   * on the long timer.
   */
  [Actions.longIncrementStart]: (state, amount) => loop(
    state
      .setIn(['long', 'loading'], true)
      .setIn(['long', 'failed'], false),
    Effects.promise(Api.longIncrement, amount)
  ),

  [Actions.longIncrementSucceed]: (state, amount) => (
    state
      .setIn(['long', 'loading'], false)
      .updateIn(['long', 'count'], (current) => current + amount)
  ),

  [Actions.longIncrementFail]: (state) => (
    state
      .setIn(['long', 'loading'], false)
      .setIn(['long', 'failed'], true)
  ),

  /**
  * This final action groups the two increment start actions with a batch.
  * `Effects.batch()` will wait for all actions in the batch to become available
  * before proceeding, so only use it if you want to wait for the longest-
  * running effect to complete before dispatching everything. In our case we
  * want both increment paths to procede independently so we use
  * `Effects.constant()` to forward into the starting actions for both paths.
  */
  [Actions.incrementBothStart]: (state, amount) => loop(
    state,
    Effects.batch([
      Effects.constant(Actions.shortIncrementStart(amount)),
      Effects.constant(Actions.longIncrementStart(amount)),
    ])
  ),
}, initialState);


/**
 * Here we set up a simple, reusable "dumb" component in the redux nomenclature
 * which we can reuse to render each counter since they have a repeatable
 * structure.
 */
const Counter = ({ loading, count, failed, onClick, name }) => {
  const failureMessage = failed ?
    <div>Failed to complete increment for {name}</div> :
    null;

  return (
    <div style={{
        opacity: loading ? 0.5 : 1,
        padding: 10
      }}>
      <div>
        <button
          disabled={loading}
          onClick={onClick}>
          {loading ? 'Loading...' : `Add 1 to ${name} counter`}
        </button>
      </div>
      <div>
        {name} counter: {count}
      </div>
      {failureMessage}
    </div>
  );
}


/**
* Careful here! Our top level state is a an Immutable Map, and `connect()` in
* react-redux attempts to spread our state object over our components, so we
* need to make sure the state is contained in a single property within our
* component's `props`. We'll call it `model` here, to be a little more like
* Elm 😄, and we'll also deserialize it to a plain object for convenience. 😆
*/
const connector = connect((state) => ({ model: state.toJS() }));


/**
 * This component is our top-level app structure which recieves the state from
 * our store. Some of the rendering will be delegated to the Counter component
 * we set up earlier. It includes one Counter for each in the store as well
 * as a button to initiate the `incrementBothStart` action.
 */
const App = connector(({ model, dispatch }) => {
  const anyLoading = model.short.loading || model.long.loading;

  return (
    <div>
      <Counter
        {...model.short}
        name="Short timeout"
        onClick={() => dispatch(Actions.shortIncrementStart(1))} />
      <Counter
        {...model.long}
        name="Long timeout"
        onClick={() => dispatch(Actions.longIncrementStart(1))} />
      <div>
        <button
          disabled={anyLoading}
          onClick={() => dispatch(Actions.incrementBothStart(1))}>
          {anyLoading ? 'Loading...' : 'Add 1 to both and wait'}
        </button>
      </div>
    </div>
  );
});


/**
 * Setting up the store is as easy as using any other enhancer, like
 * `applyMiddleware` or `DevTools.instrument()`. We can also pass any sort of
 * object, like an `Immutable.Map` as our initial state.
 */
const store = install()(createStore)(reducer, initialState);


/**
 * Make some magic!
 */
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('main')
);
