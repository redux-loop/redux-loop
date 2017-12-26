# Tutorial

## Install the store enhancer

```js
import { createStore, compose, applyMiddleware } from 'redux';
import reducer from './reducers';
import { install } from 'redux-loop';
import someMiddleware from 'some-middleware';

const enhancer = compose(
  applyMiddleware(someMiddleware),
  install()
);

const store = createStore(reducer, initialState, enhancer);
```

Installing `redux-loop` is as easy as installing any other store enhancer. You
can apply it directly over `createStore` or compose it with other enhancers
and middlewares. Composition of enhancers can be confusing, so the order in
which `install()` is applied may matter. If something like `applyMiddleware()`
doesn't work when called before `install()`, applying after may fix the issue.

### Write a reducer with some cmd objects (side effects)

```js
import { loop, Cmd } from 'redux-loop';

function initAction(){
    return {
      type: 'INIT'
    };
}

function fetchUser(userId){
    return fetch(`/api/users/${userId}`);
}

function userFetchSuccessfulAction(user){
   return {
      type: 'USER_FETCH_SUCCESSFUL',
      user
   };
}

function userFetchFailedAction(err){
   return {
      type: 'USER_FETCH_ERROR',
      err
   };
}

const initialState = {
  initStarted: false,
  user: null,
  error: null
};

function reducer(state = initialState, action) {
  switch(action.type) {
  case 'INIT':
    return loop(
      {...state, initStarted: true},
      Cmd.run(fetchUser, {
        successActionCreator: userFetchSuccessfulAction,
        failActionCreator: userFetchFailedAction,
        args: ['123']
      })
    );

  case 'USER_FETCH_SUCCESSFUL':
    return {...state, user: action.user};

  case 'USER_FETCH_FAILED':
    return {...state, error: action.error};

  default:
    return state;
  }
}
```

Any reducer can return a `loop` instead of a state object. A `loop`
joins an updated model state with a cmd for the store to process. A cmd is
just an object that describes what side effect should run, and what to do
with the result. There are several options for cmd objects, all available
under the `Cmd` module:

- `run(functionToCall, options)`
  - Accepts a function to run and options for how to call it and what to do with the result.
- `action(actionToDispatch)`
  - Accepts an action to dispatch immediately once the current dispatch cycle is completed.
- `list(cmds, options)`
  - Accepts an array of other cmd objects and runs them. Options control whether they run in parallel or in order, and when to dispatch the resulting actions.
- `map(cmd, higherOrderActionCreator, ...args)`
  - Accepts a cmd and passes the resulting action(s) through higherOrderActionCreator to create a nested action, optionally passing extra args to higherOrderActionCreator before the nested action.
- `none`
  - A no-op cmd, for convenience.

[See detailed documentation about all of the available methods from the Cmd modules](docs/api-docs/SUMMARY.md)

## combineReducers with redux-loop

The `combineReducers` implementation in `redux-loop` is aware that some of
your reducers might return cmd objects, and it knows how to properly compose them
and forward them to the store. Instead of using `combineReducers` from Redux itself,
use the version from `redux-loop` instead

```js
// Redux's combineReducers method does not know how to deal with cmd objects!
// import { createStore, combineReducers } from 'redux';

import { createStore } from 'redux';
import { combineReducers, install } from 'redux-loop';

import { firstReducer, secondReducer } from './reducers';

const reducer = combineReducers({
  first: firstReducer,
  second: secondReducer,
});

const store = createStore(reducer, initialState, install());
```

## A note on TypeScript

TypeScript is fully supported by redux-loop. Here is [an example project](https://github.com/meandmax/redux-loop-ts-example)

## Avoid circular loops!

```js
function reducer(state, action) {
  switch (action.type) {
    case 'FIRST':
      return loop(
        state,
        Cmd.action(second())
      );

    case 'SECOND':
      return loop(
        state,
        Cmd.action(first())
      );
  }
}
```
