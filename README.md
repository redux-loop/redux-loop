# redux-loop

A port of the [Elm Architecture](https://github.com/evancz/elm-architecture-tutorial) to Redux that allows you to sequence your effects naturally and purely by returning them from your reducers.

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

### Write a reducer with some Cmds (side effects)

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

Any reducer case can return a `loop` instead of a state object. A `loop` joins
an updated model state with a cmd for the store to process. A cmd is just 
an object that describes what side effect should run, and what to do with
the result. There are several options for cmds, all available under the `Cmd` object:

- `run(functionToCall, options)`
  - Accepts a function to run and options for how to call it and what to do with the result.
- `action(actionToDispatch)`
  - Accepts an `actionToDispatch` instance to dispatch immediately once the current dispatch cycle is completed.
- `list(cmds, options)`
  - Accepts an array of other cmds and runs them. Options control whether they run in parallel or in order, and when to dispatch the resulting actions.
- `map(cmd, higherOrderActionCreator, ...args)`
  - Accepts a cmd and passes the resulting action(s) through higherOrderActionCreator to create a nested action, optionally passing extra args to higherOrderActionCreator before the nested action.
- `none`
  - A no-op cmd, for convenience.

[See detailed documentation about all of the available Cmds](docs/ApiDocs.md)

#### Accessing state and dispatching actions from your Cmds

While most of your side effect methods should be agnostic to redux, sometimes you
will need the flexibility of accessing arbitrary slices of state or dispatching an
action separately from the result of the cmd. Here's an example of how you can do this.

```js
import {loop, Cmd} from 'redux-loop';
import {doSomething} from 'something.js';
import {doSomethingResultAction} from './actions.js';
function reducer(state, action) {
  switch(action.type) {
  case 'ACTION':
    return loop(
      {...state, initStarted: true},
      Cmd.run(doSomething, {
         successActionCreator: doSomethingResultAction,
         args: [Cmd.getState, Cmd.dispatch]
      })
    );
  default:
    return state;
  }
}

//something.js
export function doSomething(getState, dispatch){
   let value = getState().some.random.value;
   dispatch(someRandomAction());
}
```

Cmd.getState and Cmd.dispatch are just symbols that the enhanced store will
replace with the actual functions at the time the cmd is executed. You can 
use these symbols as parameters to your cmds as you would any other parameter (the
order does not matter).

### Easily test reducer results

```js
import test from 'tape';
import reducer, { fetchDetails } from './reducer';
import { loadingStart, loadingSuccess, loadingError } from './actions';
import { Cmd, loop } from 'redux-loop';

test('reducer works as expected', (t) => {
  const state = { loading: false };

  const result = reducer(state, loadingStart(1));

  t.deepEqual(result, loop(
    { loading: true },
    Cmd.run(fetchDetails, {
      successActionCreator: loadingSuccess,
      failActionCreator: loadingError,
      args: [1]
    })
  ));
});
```

Cmds are declarative specifications of the next behavior of the store. They
are only processed by an active store, pushing effecting behavior to the edge of
the application. You can call a reducer as many times with a given action and
state and always get a result which is `deepEqual`.

> CAVEAT
> For testing sanity, always pass a referenceable function to a cmd.
> Functions curried or bound from the same function with the same arguments are
> not equal within JavaScript, and so are best to avoid if you want to compare
> effects in your tests.

### combineReducers with redux-loop

```js
import { createStore } from 'redux';
import { combineReducers, install } from 'redux-loop';

import { firstReducer, secondReducer } from './reducers';

const reducer = combineReducers({
  first: firstReducer,
  second: secondReducer,
});

const store = createStore(reducer, initialState, install());
```

The `combineReducers` implementation in `redux-loop` is aware that some of
your reducers might return cmds, and it knows how to properly compose them
and forward them to the store. 

#### How to use combineReducers when using libraries such as immutable.js

Our `combineReducers` can also handle states made of data structures
other than the default `{}`, you simply pass it in the root state,
an accessor function (which returns a value for that key), and a mutator
function (which returns a **new version** of the object with a value
set at a given key). The example below demonstrates using Immutable.js'
Map() data structure, but you can use any `key => value` data structure
as long as you provide your own accessor and mutator functions.

While these customization features are provided for convenience, if you
are using using something other than a plain object as your state, you should
consider writing your own implementation of combineReducers, using our 
version as a reference. It's impossible to provide a generic combineReducers
that will be optimal for all state shapes. As an example, updating an immutable.js
state would be much faster if you made use of the withMutations method to run updates. 

```js
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

### Avoid circular loops!

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
