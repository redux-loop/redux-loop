# redux-loop

[![Build Status](https://travis-ci.org/raisemarketplace/redux-loop.svg?branch=master)](https://travis-ci.org/raisemarketplace/redux-loop)


Sequence your effects naturally and purely by returning them from your reducers.
Inspired by [elm-effects](https://github.com/evancz/elm-effects) and the [Elm
Architecture](https://github.com/evancz/elm-architecture-tutorial).

## Quick Example

```javascript
import { createStore } from 'redux';
import { install, loop, Effects } from 'redux-loop';
import { fromJS } from 'immutable';

const firstAction = {
  type: 'FIRST_ACTION',
};

const doSecondAction = (value) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'SECOND_ACTION',
        payload: value,
      });
    });
  });
}

const thirdAction = {
  type: 'THIRD_ACTION',
};

// immutable store state allowed by default, but not required
const initialState = fromJS({
  firstRun: false,
  secondRun: false,
  thirdRun: false,
});

function reducer(state, action) {
  switch(action.type) {

  case 'FIRST_ACTION':
    // Enter a sequence at FIRST_ACTION, SECOND_ACTION and THIRD_ACTION will be
    // dispatched in the order they are passed to batch
    return loop(
      state.set('firstRun', true),
      Effects.batch([
        Effects.promise(doSecondAction, 'hello'),
        Effects.constant(thirdAction)
      ])
    );

  case 'SECOND_ACTION':
    return state.set('secondRun', action.payload);

  case 'THIRD_ACTION':
    return state.set('thirdRun', true);

  default:
    return state;
  }
}

const store = install()(createStore)(reducer, initialState);

store
  .dispatch(firstAction);
  .then(() => {
    // dispatch returns a promise for when the current sequence is complete
    // { firstRun: true, secondRun: 'hello', thirdRun: true }
    console.log(store.getState().toJS());
  });
```

## Why use this?

Having used and followed the progression of Redux and the Elm Architecture, and
after trying other effect patterns for Redux, we came to the following
conclusion:

> Synchronous state transitions caused by returning a new state from the reducer
> in response to an action are just one of all possible effects an action can
> have on application state.

Many other methods for handling effects in Redux, especially those implemented
with action-creators, incorrectly teach the user that asynchronous effects are
fundamentally different from synchronous state transitions. This separation
encourages divergent and increasingly specific means of processing particular
types effects. Instead, we should focus on making our reducers powerful enough
to handle asynchronous effects as well as synchronous state transitions. With
`redux-loop`, the reducer doesn't just decide what happens _*now*_ due to a
particular action, it decides what happens _*next*_. All of the behavior of your
application can be traced through one place, and that behavior can be easily broken
apart and composed back together. This is one of the most powerful features of the
[Elm architecture](https://github.com/evancz/elm-architecture-tutorial), and with
`redux-loop` it is a feature of Redux as well.

## Tutorial

### Install the store enhancer

```javascript
import { createStore } from 'redux';
import reducer from './reducers';
import { install } from 'redux-loop';

const store = install()(createStore)(reducer);
```

Installing `redux-loop` is as easy as installing any other store enhancer. You
can apply it directly over `createStore` or compose it with other enhancers
and middlewares. For best results, we recommend installing this enhancer such
that other enhancers like `devtools` will receive the result of `getState()`
from `redux-loop`.

### Write a reducer with some effects

```javascript
import { Effects, loop } from 'redux-loop';
import { loadingStart, loadingSuccess, loadingFailure } from './actions';

export function fetchDetails(id) {
  return fetch(`/api/details/${id}`)
    .then((r) => r.json())
    .then(loadingSuccess)
    .catch(loadingFailure);
}

export default function reducer(state, action) {
  switch (action.type) {
    case 'LOADING_START':
      return loop(
        { ...state, loading: true },
        Effects.promise(fetchDetails, action.payload.id)
      );

    case 'LOADING_SUCCESS':
      return {
        ...state,
        loading: false,
        details: action.payload
      };

    case 'LOADING_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload.message
      };

    default:
      return state;
  }
}
```

Any reducer case can return a `loop` instead of a state object. A `loop` joins
an updated model state with an effect for the store to process. There are
several options for effects, all available under the `Effects` object:

- `promise(factory, ...args)`
  - Accepts a `factory` function that returns a `Promise` for an action
    instance when called with `args`.
- `constant(action)`
  - Accepts an `action` instance to dispatch immediately once the current
    dispatch cycle is completed.
- `batch(effects)`
  - Accepts an array of other effects and runs them in parallel, dispatching
    the resulting actions once all effects are resolved.
- `none()`
  - A no-op action, for convenience when writing custom effect creators

### Easily test reducer results

```javascript
import test from 'tape';
import reducer, { fetchDetails } from './reducer';
import { loadingStart } from './actions';
import { Effects, loop } from 'redux-loop';

test('reducer works as expected', (t) => {
  const state = { loading: false };

  const result = reducer(state, loadingStart(1));

  t.deepEqual(result, loop(
    { loading: true },
    Effects.promise(fetchDetails, 1)
  ));
});
```

Effects are declarative specifications of the next behavior of the store. They
are only processed by an active store, pushing effecting behavior to the edge of
the application. You can call a reducer as many times with a given action and
state and always get a result which is `deepEqual`.

> CAVEAT
> For testing sanity, always pass a referenceable function to `Effects.promise`.
> Functions curried or bound from the same function with the same arguments are
> not equal within JavaScript, and so are best to avoid if you want to compare
> effects in your tests.

### Use the custom `combineReducers` if you need it

```javascript
import { createStore } from 'redux';
import { combineReducers, install } from 'redux-loop';

import { firstReducer, secondReducer } from './reducers';

const reducer = combineReducers({
  first: firstReducer,
  second: secondReducer,
});

const store = install()(createStore)(reducer);
```

The `combineReducers` implementation in `redux-loop` is aware that some of
your reducers might return effects, and it knows how to properly compose them
and forward them to the store. The built-in `createStore` in `redux` will not
properly identify effects from your nested reducers' results and execute them,
and the `redux-loop` implementation is completely compatible with the behavior
of the built-in version so there should be no problem with exchanging it.

### Avoid circular loops!

```javascript
function reducer(state, action) {
  switch (action.type) {
    case 'FIRST':
      return loop(
        state,
        Effects.constant(second())
      );

    case 'SECOND':
      return loop(
        state,
        Effects.constant(first())
      );
  }
}
```

This minimal example will cause perpetual dispatching! While it is also possible
to make this mistake with large, complicated networks of `redux-thunk` action
creators, it is much easier to spot the mistake before it is made. It helps to
keep your reducers small and focused, and use `combineReducers` or manually
compose reducers so that the number of actions you deal with at one time is
small. A small set of actions which initiate a `loop` will help reduce the
likelihood of causing circular dispatches.

## Contributing

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms. Multiple language translations are available at (contributor-covenant.org)[http://contributor-covenant.org/version/1/3/0/i18n/]
