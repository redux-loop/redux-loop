# API Docs

* [`install()`](#install)
* [`loop(state, effect)`](#loopstate-effect)
* [`liftState(state)`](#liftstatestate)
* [`getModel(loop)`](#getmodelloop)
* [`getEffect(loop)`](#geteffectloop)
* [`Effects`](#effects)
  * [`Effects.none()`](#effectsnone)
  * [`Effects.constant(action)`](#effectsconstantaction)
  * [`Effects.call(actionFactory, ...args)`](#effectsactionfactory-args)
  * [`Effects.promise(promiseFactory, ...args)`](#effectspromisepromisefactory-args)
  * [`Effects.batch(effects)`](#effectsbatcheffects)
  * [`Effects.lift(effect, higherOrderActionCreator, [...additionalArgs])`](#effectslifteffect-higherorderactioncreator-additionalargs)
* [`combineReducers(reducersMap)`](#combinereducersreducersmap)

## `install()`

#### Notes
`install` applies the store enhancer to Redux's `createStore`. You'll need to
apply it either independently or with `compose` to use redux-loop's features in
your store. redux-loop internally takes over your top level state's shape and
and then decorates `store.getState` in order to provide your app with the state
you are expecting. You'll need to account for this if you are using other
enhancers like `applyMiddleware` or `DevTools.instrument` by applying `install`
last.

#### Examples
**Applied separately (no other enhancers):**

```javascript
import { createStore } from 'redux';
import { install } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, initialState, install());
```

**Applied with other enhancers:**
```javascript
import { createStore, compose, applyMiddleware } from 'redux';
import someMiddleware from 'some-middleware';
import installOther from 'other-enhancer';
import { install as installReduxLoop } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const enhancer = compose(
  applyMiddleware(someMiddleware),
  installOther(),
  installReduxLoop()
);

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, initialState, enhancer);
```

## `loop(state, effect): [any, Effect]`

* `state: any` &ndash; the new store state, like you would normally return from
  a reducer.
* `effect: Effect` &ndash; an effect to run once the current action has been
  dispatched, can be a result of any of the functions available under `Effects`.
* returns an `Array` pair of the `state` and the `effect`, to allow for easy
  destructuring as well as a predictable structure for other functionality.

#### Notes

`loop` enables you to run effects as the result of a particular action being
dispatched. It links synchronous state transitions with expected async state
transitions. When you return a `loop` result from your reducer, the store knows
how to separate effects from state so effects are not stored in the state tree
with data.

#### Examples

```javascript
import { loop, Effects } from 'redux-loop';

function reducer(state, action) {
  switch(action.type) {
    case 'FIRST':
      // This result is a loop. The new state will have its `first` property
      // set to true. As a result of receiving this result from the reducer,
      // the store will not only replace this part of the state with the new
      // state setting `first` to true, it will schedule the SECOND action to
      // run next.
      return loop(
        { ...state, first: true },
        Effects.constant({ type: 'SECOND' })
      );

    case 'SECOND':
      // This result is not a loop, just a plain synchronous state transition.
      // Returning loops from a reducer is optional by branch. The store knows
      // how to examine results and compose effects into a separate effect tree
      // from the state tree.
      return { ...state, second: true };
  }
}
```

## `liftState(state): [any, Effect]`

* `state: any` &ndash; an object which may be the state of the redux store, or
  an existing `[any, Effect]` pair created by `loop()`.

#### Notes

Automatically converts objects to `loop()` results. If the value was created
with `loop()`, then the function behaves as an identity. Otherwise, it is lifted
into a `[any, Effect]` pair where the effect is `Effects.none()`. Useful for
forcing reducers to always return a `loop()` result, even if they shortcut to
just the model internally.

#### Example

```javascript
function reducer(state, action) {
  switch(action.type) {
    case 'LOAD_START':
      return loop(
        { ...state, isLoading: true },
        Effects.promise(apiFetch, action.payload.id)
      );
    case 'LOAD_COMPLETE':
      return {
        ...state,
        isLoading: false,
        result: action.payload,
      };
    default:
      return state;
  }
}

// This guarantees that the return value of the reducer will be a loop result,
// regardless of if it was set as such in the reducer implementation. This makes
// it much easier to manually compose reducers without cluttering reducer
// implementations with `loop(state, Effects.none())`.
export default compose(reducer, liftState);
```


## `getModel(loop): any`

* `loop: any` &ndash; any object.
* returns the model component of the array if the input is a `[any, Effect]`
  pair, otherwise returns the input object.

#### Notes

`getModel` lets you extract just the model component of an array returned by
`loop`. It's useful in testing if you need to extract out the model component
to do custom comparisons like `Immutable.is()`.


## `getEffect(loop): Effect | null`

* `loop: any` &ndash; any object.
* returns the effect component of the array if the input is a `[any, Effect]`
  pair, otherwise returns `null`.

#### Notes

`getEffect` lets you extract just the effect component of an array returned by
`loop`. It's useful in testing if you need to separate the model and effect and
test them separately.


## `Effects`

#### Notes

The `Effects` object provides access to all of the functions you'll need to
represent different kinds of effects to redux-loop's effects processor. Every
effect is a plain JavaScript object that simply describes to the store how to
process it. Effects are never executed in the reducer, leaving your reducer pure
and testable.

### `Effects.none()`

#### Notes

`none` is a no-op effect that you can use for convenience when building custom
effect creators from the ones provided. Since it does not resolve to an action
it doesn't cause any effects to actually occur.

#### Examples

```javascript
// The following two expressions are equivalent when processed by the store.

return loop(
  { state, someProp: action.payload },
  Effects.none()
);

// ...

return { state, someProp: action.payload }
```

### `Effects.constant(action)`

* `action: Action` &ndash; a plain object with a `type` property that the store
  can dispatch.

#### Notes

`constant` allows you to schedule a plain action object for dispatch after the
current dispatch is complete. It can be useful for initiating multiple sequences
that run in parallel but don't need to communicate or complete at the same time.

#### Examples

```javascript
// Once the store has finished updating this part of the state with the new
// result where `someProp` is set to `action.payload` it will schedule another
// dispatch for the action SOME_ACTION.
return loop(
  { state, someProp: action.payload },
  Effects.constant({ type: 'SOME_ACTION' })
);
```

### `Effects.call(actionFactory, ...args)`

* `actionFactory: (...Array<any>) => Action` &ndash; a function that will run
  some synchronous effects and then return an action to represent the result.
* `args: Array<any>` &ndash; any arguments to call `actionFactory` with.


#### Notes

`call` allows you to declaratively schedule a function with some arguments that
can cause synchronous effects like manipulating `localStorage` or interacting
with `window` and then return an action to represent the outcome. The return
value of `call` must be an action. If you find it necessary to execute effects
in response to a state change that don't result in further actions, you should
implement a subscriber to the store via `store.subscribe()`.

#### Examples

```javascript
const readKeyFromLocalStorage = (key) => {
  return Actions.updateFromLocalStorage(localStorage[key]);
}

// ...

return loop(
  state,
  Effects.call(readKeyFromLocalStorage, action.payload)
);
```

### `Effects.promise(promiseFactory, ...args)`

* `promiseFactory: (...Array<any>) => Promise<Action>` &ndash; a function which,
  when called with the values in `args`, will return a Promise that will
  _**always**_ resolve to an action, even if the underlying process fails.
  Remember to call `.catch`!
* `args: Array<any>` &ndash; any arguments to call `promiseFactory` with.

#### Notes

`promise` allows you to declaratively schedule a function to be called with some
arguments that returns a Promise for an action, which will then be awaited and
the resulting action dispatched once available. This function allows you to
represent almost any kind of async process to the store without sacrificing
functional purity or having to encapsulate implicit state outside of your
reducer. Keep in mind, functions that are handed off to the store with `promise`
are never invoked in the reducer, only by the store during your application's
runtime. You can invoke a reducer that returns a `promise` effect as many times
as you want and always get the same result by deep-equality without triggering
any async function calls in the process.

#### Examples

```javascript
function fetchData(id) {
  return fetch(`endpoint/${id}`)
    .then((r) => r.json())
    .then((data) => ({ type: 'FETCH_SUCCESS', payload: data })
    .catch((error) => ({ type: 'FETCH_FAILURE', payload: error.message }));
}

function reducer(state, action) {
  switch(action.type) {
    case 'FETCH_START':
      return loop(
        { ...state, loading: true },
        Effects.promise(fetchData, action.payload.id)
      );

    case 'FETCH_SUCCESS':
      return { ...state, loading: false, data: action.payload };

    case 'FETCH_FAILURE':
      return { ...state, loading: false, errorMessage: action.payload };
  }
}
```

### `Effects.batch(effects)`

* `effects: Array<Effect>` &ndash; an array of effects returned by any of the
  other effects functions, or even nested calls to `Effects.batch`

#### Notes

`batch` allows you to group effects as a single effect to be awaited and
dispatched. All effects run in a batch will be executed in parallel, but they
will not proceed in parallel. For example, if a long-running request is batched
with an action scheduled with `Effects.constant`, no dispatching of either
effect will occur until the long-running request completes.

#### Examples

```javascript
// In this example, we can DRY up the setting of the `loading` property by
// batching `fetchData` with a `STOP_LOADING` action.

function fetchData(id) {
  return fetch(`endpoint/${id}`)
    .then((r) => r.json())
    .then((data) => ({ type: 'FETCH_SUCCESS', payload: data })
    .catch((error) => ({ type: 'FETCH_FAILURE', payload: error.message }));
}

function reducer(state, action) {
  switch(action.type) {
    case 'FETCH_START':
      return loop(
        { ...state, loading: true },
        Effects.batch([
          Effects.promise(fetchData, action.payload.id),
          Effects.constant({ type: 'STOP_LOADING' })
        ])
      );

    case 'FETCH_SUCCESS':
      return { ...state, data: action.payload };

    case 'FETCH_FAILURE':
      return { ...state, errorMessage: action.payload };

    case 'STOP_LOADING':
      return { ...state, loading: false };
  }
}
```

### `Effects.lift(effect, higherOrderActionCreator, [...additionalArgs])`

* `effect: Effect` &ndash; an effect, the resulting action of which will be
  passed to `higherOrderActionCreator` to be nested into a higher-order action.
* `higherOrderActionCreator` &ndash; an action creator function which will
  accept an action, or optional some other arguments followed by an action, and
  return a new action in which the previous action was nested.
* `additionalArgs` &ndash; a list of additional arguments to pass to
  `higherOrderActionCreator` before passing in the action from the effect.


#### Notes

`lift` allows you to take an existing effect from a nested reducer in your
state and lift it to a more general action in which the resulting action is
nested. This enables you to build your reducer in a fractal-like fashion, in
which all of the logic for a particular slice of your state is totally
encapsulated and actions can be simply directed to the reducer for that slice.

#### Examples

**nestedState.js**
```javascript
function incrementAsync(amount) {
  return new Promise((resolve) => {
    setTimeout(() => (
      resolve({ type: 'INCREMENT_FINISH', payload: amount })
    ), 100);
  });
}

function incrementStart(amount) {
  return { type: 'INCREMENT_START', payload: amount };
}

function nestedReducer(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT_START':
      return loop(
        state,
        Effects.promise(incrementAsync, action.payload)
      );
    case 'INCREMENT':
      return loop(
        state + action.payload,
        Effects.none()
      );
    default:
      return loop(
        state,
        Effects.none()
      );
  }
}
```

**topState.js**
```javascript
import nestedReducer from './nestedState';

function nestedAction(action) {
  return { type: 'NESTED_ACTION', payload: action };
}

function reducer(state = { /* ... */ }, action) {
  switch(action.type) {
    // ... other top-level things

    case 'NESTED_ACTION':
      const [model, effects] = nestedReducer(state.nestedCount, action.payload);
      return loop(
        { ...state, nestedCount: model },
        Effects.lift(effect, nestedAction)
      );

    default:
      return state;
  }
}
```

## `combineReducers(reducersMap)`

* `reducersMap: Object<string, ReducerFunction>` &ndash; a map of keys to nested
  reducers, just like the `combineReducers` you would find in Redux itself.

#### Notes

Reducer composition is key to a clean Redux application. The built-in Redux
`combineReducers` won't work for nested reducers that use `loop`, so we included
one that is aware that some reducers might have effects. The `combineReducers`
in redux-loop knows how to compose effects as well as state from nested reducers
so that your effects tree is always separate from your state tree. It's also
completely compatible with the one in Redux, so there should be no issues
switching to this implementation.

#### Examples

```javascript
import { combineReducers } from 'redux-loop';
import reducerWithEffects from './reducer-with-effects';
import plainReducer from './plain-reducer';

export default combineReducers({
  withEffects: reducerWithEffects,
  plain: plainReducer
});
```
