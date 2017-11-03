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

## Installation

```
npm install --save redux-loop
```

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
  - Accepts an action to dispatch immediately once the current dispatch cycle is completed.
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

#### Simulating Cmds

Occasionally you may find yourself in a situation where you need to pass more than one parameter to an action creator, such as:

```js
Cmd.run(foo, {
  successActionCreator: foo => actionCreator(foo, state.blah)
})
```

You can't do a deep equality check on this because the success action creator is always new. Instead, you can simulate the cmd to test the action creators.

```js
import { Cmd, getCmd, getModel } from 'redux-loop';
...

let result = reducer(state, action);
expect(getModel(result)).toEqual(whatever);
let cmd = getCmd(result);

//test the rest of the cmd
expect(cmd).toEqual(Cmd.run(foo, {
  testInvariants: true,
  successActionCreator: jasmine.any(Function) //replace with your testing library's equivalent matcher
}));

expect(cmd.simulate({success: true, result: 123})).toEqual(actionCreator(123, state.blah));
expect(cmd.simulate({success: false, result: 123})).toBe(null);

```

You can simulate any Cmd to test the actions returned. Lists take arrays of simulations for their child cmds.

[See detailed documentation about simulating Cmds](docs/ApiDocs.md)

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

### How to nest reducers inside parents with their own functionality

`combineReducers` is great for the case where your parent reducer has no functionality of its own, just children.
However, it's often the case that you want to nest a specific reducer inside a generic parent reducer.

`mergeChildReducers` lets you do this. It merges child reducer state into the parent state while
composing any Cmds returned by any of the reducers and passing them along to the store.

```js

const initialState = {foo: null};

function parentReducer(state = initialState, action){
  //typical reducer
}

export default function reducer(state, action){
   let parentResult = parentReducer(state, action);
   return mergeChildReducers(parentResult, action, {child: childReducer});
}

//final state shape is {foo, child}; foo.child is state returned by childReducer
```

`combineReducers` just returns a reducer with a specific usage of `mergeChildReducers` (one in which
the child map never changes, the parent state is an empty object, and all children always get called). 
By using `mergeChildReducers` in your reducer, you can choose which children are used when and under what key names.

By using `combineReducers` or `mergeChildReducers` everywhere your reducer tree nests, all Cmds resulting 
from a single dispatched action will always be batched up into a single Cmd at the top of the tree and 
processed correctly by the store. 

### How to use `combineReducers` and `mergeChildReducers` with ImmutableJS and other libraries

It's impossible to write a version of `combineReducers` or `mergeChildReducers` that supports all use cases well.
You may want your parent state to be an array or you may be using a library such as ImmutableJS with non-standard data structures. [Like redux's implementation of combineReducers](http://redux.js.org/docs/recipes/reducers/BeyondCombineReducers.html), redux-loop's are designed to only work with plain JS objects.
Certain implementations may be generic enough to handle many use cases, but chances are that they will be
sub-optimal in most scenarios. For example, when iterating over properties of an Immutable Map to update children,
unless you use withMutations, you will create a new parent object for each key that you iterate over and will
have worse performance.

For this reason, we have broken out integrations with popular libraries into separate packages.

- [ImmutableJS](https://github.com/redux-loop/redux-loop-immutable)

If your use case is not currently supported, we encourage you to write your own helpers to compose reducers that
fit your specific needs. The only requirement for redux-loop is that they pull the commands out of the child results and batch them together into a single Cmd to be passed along in the resulting loop object.
See the [mergeChildReducers](src/merge-child-reducers.js) and [combineReducers](src/combineReducers.js) implementations for reference.

If you have a popular use case or library that is not currently supported, please file an issue and we can discuss if it makes sense for us to support a custom integration. 

## Discuss
[Come join our slack channel.](https://reduxloop-slack.herokuapp.com/)

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

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms. Multiple language translations are available at [contributor-covenant.org](https://www.contributor-covenant.org/translations.html)
