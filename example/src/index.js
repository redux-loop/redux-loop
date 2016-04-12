import React from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import { store, Actions } from './store';

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
* Elm 😄, and we'll also deserialize it to a plain object for convenience.
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


store.subscribe(() => {
  const isEmpty = store.isEffectsQueueEmpty();
  console.log(`Effects queue is ${isEmpty ? '' : 'not '}empty`);
});

/**
 * Make some magic!
 */
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('main')
);
