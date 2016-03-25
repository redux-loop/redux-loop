# redux-loop

[![Build Status](https://travis-ci.org/raisemarketplace/redux-loop.svg?branch=master)](https://travis-ci.org/raisemarketplace/redux-loop)


Sequence your effects naturally and purely by returning them from your reducers.
Inspired by [elm-effects](https://github.com/evancz/elm-effects) and the [Elm
Architecture](https://github.com/evancz/elm-architecture-tutorial).

> Isn't it incorrect to cause side-effects in a reducer?

Yes! Absolutely.

> Doesn't redux-loop put side-effects in the reducer?

It doesn't. The values returned from the reducer when scheduling an effect with
redux-loop only _describe_ the effect. Calling the reducer will not cause the
effect to run. The value returned by the reducer is just an object that the
store knows how to interpret when it is enhanced by redux-loop. You can safely
call a reducer in your tests without worrying about waiting for effects to finish
and what they will do to your environment.

> What are the environment requirements for redux-loop?

`redux-loop` requires polyfills for ES6 `Promise` and `Symbol` to be included if
the browsers you target don't natively support them.

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

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, initialState, install());

store
  .dispatch(firstAction)
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
import { createStore, compose, applyMiddleware } from 'redux';
import reducer from './reducers';
import { install } from 'redux-loop';
import someMiddleware from 'some-middleware';

const enhancer = compose(
  applyMiddleware(someMiddleware),
  install()
);

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, initialState, enhancer);
```

Installing `redux-loop` is as easy as installing any other store enhancer. You
can apply it directly over `createStore` or compose it with other enhancers
and middlewares. Composition of enhancers can be confusing, so the order in
which `install()` is applied may matter. If something like `applyMiddleware()`
doesn't work when called before `install()`, applying after may fix the issue.

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

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, initialState, install());
```

The `combineReducers` implementation in `redux-loop` is aware that some of
your reducers might return effects, and it knows how to properly compose them
and forward them to the store. The built-in `createStore` in `redux` will not
properly identify effects from your nested reducers' results and execute them,
and the `redux-loop` implementation is completely compatible with the behavior
of the built-in version so there should be no problem with exchanging it.

## Using redux-loop's `combineReducers` with Immutable.js (or any other data structure)

```javascript
import { combineReducers } from 'redux-loop';
import { Map } from 'immutable';

import { firstReducer, secondReducer } from './reducers';

const reducers = {
  first: firstReducer,
  second: secondReducer,
}

//Map() is now used as the new root state, and custom accessor and mutator properties are provided
const reducer = combineReducers(
    reducers,
    Map(),
    (child, key) => child.get(key),
    (child, key, value) => child.set(key, value)
);

```

Our `combineReducers` can also handle states made of data structures
other than the default `{}`, you simple pass it in the root state,
an accessor function (which returns a value for that key), and a mutator
function (which returns a **new version** of the object with a value
set at a given key). The example above demonstrates using Immutable.js'
Map() data structure, but you can use any `key => value` data structure
as long as you provide your own accessor and mutator functions.

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

## Support

Potential bugs, generally discussion, and proposals or RFCs should be submitted
as issues to this repo, we'll do our best to address them quickly. We use this
library as well and want it to be the best it can! For questions about using the
library, [submit questions on StackOverflow](http://stackoverflow.com/questions/ask)
with the [`redux-loop` tag](http://stackoverflow.com/questions/tagged/redux-loop).

### Don't see a feature you want?

If you're interested in adding something to `redux-loop` but don't want to wait
for us to incorporate the idea you can follow these steps to get your own installable
version of `redux-loop` with your feature included:

1. Fork the main repo here
1. Add your feature or change
1. Change the package `"name"` in package.json to be `"@<your-npm-username>/redux-loop`
1. Commit to master and `npm publish`
1. `npm install @<your-npm-username>/redux-loop`

We are _**always**_ interested in new ideas, but sometimes we get a little busy and fall
behind on responding and reviewing PRs. Hopefully this process will allow you to
continue making progress on your projects and also provide us with more context if and
when you do decide to make a PR for your new feature or change. The best way to verify
new features for a library is to use them in real-world scenarios!

## Contributing

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms. Multiple language translations are available at [contributor-covenant.org](http://contributor-covenant.org/version/1/3/0/i18n/)
