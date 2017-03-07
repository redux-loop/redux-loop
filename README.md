# <img alt='redux-loop' src='https://raw.githubusercontent.com/redux-loop/redux-loop/master/logo/logo.png' height='200'>

[![Build Status](https://travis-ci.org/redux-loop/redux-loop.svg?branch=master)](https://travis-ci.org/redux-loop/redux-loop)


A port of the idea behind [The Elm Architecture](https://guide.elm-lang.org/architecture/) to Redux
that allows you to sequence your effects naturally and purely by returning them
from your reducers. This is a partial port because we want to keep API surface area for the library as small as possible.

> Is it correct to cause side-effects in a reducer?

Yes! Absolutely.

> Doesn't redux-loop put side-effects in the reducer?

It doesn't. The values returned from the reducer when scheduling an effect with
redux-loop only _describe_ the effect. Calling the reducer will not cause the
effect to run. The value returned by the reducer is just an object that the
store knows how to interpret when it is enhanced by redux-loop. You can safely
call a reducer in your tests without worrying about waiting for effects to finish
and what they will do to your environment.

> What are the environment requirements for redux-loop?

`redux-loop` requires polyfill for ES6 `Promise` to be included if
the browsers you target don't natively support them.

## Install

```
npm install --save redux-loop
```

## Quick Example

```javascript
import { createStore, Effects } from 'redux-loop';

const FIRST_ACTION = 'FIRST_ACTION';
const SECOND_ACTION = 'SECOND_ACTION';

const init = {
  state: {
    firstActionDispatched: false,
    secondActionDispatched: false,
  },
  effects: [
    Effects.fromLazyPromise(
      () => Promise.resolve({ type: FIRST_ACTION })
    )
  ],
};

function reducer(state, action) {
  switch(action.type) {

    case FIRST_ACTION:
      return {
        state: {
          ...state,
          firstActionDispatched: true,
        },
        effects: [
          Effects.fromLazyPromise(
            () => Promise.resolve({ type: SECOND_ACTION })
          )
        ]
      };

    case SECOND_ACTION:
      return {
        state: {
          ...state,
          secondActionDispatched: true,
        },
        effects: [],
      };

    default:
      return state;
    }
}

const store = createStore(reducer, init);
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

## API

* [`createLoopStore`](#createLoopStore)
* [`Effects`](#effects)
  * [`Effects.fromLazyPromise`](#effectsfromlazypromise)
  * [`Effects#map`](#effectsmap)

### createLoopStore

| Argument     | Required | Description |
|--------------|----------|-------------
| reducer      | true     | Reducer which returns new state and effects. **Note:** You can't use `composeReducers` because this function do not handle effects.
| initialState | true     | Initial state and initial effects.
| enhancer     | false    | Usual Redux ehancer. So you can use all the middlewares you are used to including Redux DevTools

To be able to have side-effects within initial state as well as return them from reducer we created our own implementation of createStore.

Don't panic! We use original Redux store creation under the hood. So you will be able to use all your favorite middlewares and dev tools!

Following examle illustrates how very simple store creation could be done.

```js
import * as ReduxLoop from 'redux-loop';

const store = ReduxLoop.createStore(
  function reducer(state, action) {
    return { state, effects: [] };
  },
  {
    state: 'your initial state'
    effects: [/* your initial effects */]
  },
  // As in Redux itself you can pass enhancer as a third argument.
  // It will be passed down to the Redux store.
  enhancer
);
```

#### Important differences

First of all you can't use `composeReducers` anymore. This is mostly done to reduce API surface area. You can still write your own and use it if you want to.

You can actually compose them on your own.

```js
// Counter.js

export const initialState = 0;

export function reducer(state, action) {
  case 'INCREMENT':
    return state + 1;
  case 'DECREMENT':
    return state - 1;
  default:
    return state;
}

export function View({ state, dispatch }) {
  return (
    <div>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <span>{state}</span>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
    </div>
  );
}
```

```js
// Main.js

import * as Counter from './Counter';

export const initialState = {
  top: Counter.initialState,
  bottom: Counter.initialState,
};

export function reducer(state, action) {
  case 'TOP_COUNTER_ACTION': {
    const { state: counterState } = Counter.reducer(state.top, action.nestedAction);

    return {
      ...state,
      top: counterState
    };
  }

  case 'BOTTOM_COUNTER_ACTION': {
    const { state: counterState } = Counter.reducer(state.bottom, action.nestedAction);

    return {
      ...state,
      top: counterState
    };
  }

  default:
    return state;
}

export function View({ state, dispatch }) {
  return (
    <div>
      <div>
        Counter #1: 
        <Counter.View
          state={state.top}
          dispatch={action => dispatch({ type: 'TOP_COUNTER_ACTION', nestedAction: action })} />
      </div>
      <div>
        Counter #2: 
        <Counter.View
          state={state.bottom}
          dispatch={action => dispatch({ type: 'BOTTOM_COUNTER_ACTION', nestedAction: action })} />
      </div>
    </div>
  );
}
```

```js
// index.js

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux-loop';

import * as Main from './Main';

const mountNode = document.getElementById('app');

function renderApp(state) {
  ReactDOM.render(
    <Main.View state={state} dispatch={store.dispatch} />,
    mountNode
  );
}

const store = createStore(Main.reducer, Main.initialState);
store.subscribe(() => renderApp(store.getState()))
renderApp(store.getState());
```

It might look complex and actually it is. For this particular example it probably do not make any sense to create separate module for `Counter`. However intention of this example is to illustrata how you can create reusable and composable modules on your own.

### Effects

#### Effects.fromLazyPromise

This is the only method you need to create any side-effect in your application.

```js
const effect = Effects.fromLazyPromise(
  () => Promise.resolve({ type: 'YOUR_ACTION_TYPE' })
);
```

The reason we need it is because JavaScript promises get executed immediately which eliminates all the purity of our reducer.

The only important thing here is that promise you use should return valid action both upon success and failure.

```js
const effect = Effects.fromLazyPromise(() => {
  return new Promise((resolve, reject) => {
    const rnd = Math.random();

    if (rnd < 0.5) {
      reject('OMG!');
    }
    else {
      return resolve(rnd);
    }
  })
  .then(rnd => {
    return {
      type: 'SUCCESS',
      payload: rnd,
    };
  })
  .catch(() => {
    return {
      type: 'FAILURE',
    };
  });
});
```

If you for some reason forgot to use `catch` to handle fail case we will notify you with handful error message!

#### Effects#map

You will need this method, well, for mapping your `Effects`. This is pretty similar to mapping an array.

```js
[1, 2, 3].map(x => x * x);
// [1, 4, 9]
```

Whenever you map an array you get a new array with each value being transformed with the function provided. Whenever you map an `Effect` you get a new `Effect` with it's value being transformed with the function. The primary use case for it is to be able to nest actions one withing the other.

```js
Effects
  .fromLazyPromise(
    () => Promise.resolve({ type: 'ACTION', foo: 'bar' })
  )
  .map(action => {
    return {
      type: 'WRAPPED_ACTION',
      nestedAction: action,
    }
  });

/*
{
  type: 'WRAPPED_ACTION',
  nestedAction: {
    type: 'ACTION',
    foo: 'bar'
  },
}
*/
```

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
