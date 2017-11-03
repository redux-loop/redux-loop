# API Docs

* [`install()`](#install)
* [`loop(state, cmd)`](#loopstate-cmd-any-cmd)
* [`liftState(state)`](#liftstatestate-any-cmd)
* [`getModel(loop)`](#getmodelloop-any)
* [`getCmd(loop)`](#getcmdloop-cmd--null)
* [`isLoop(object)`](#isloopobject-boolean)
* [`Cmds`](#cmds)
  * [`Cmd.none`](#cmdnone)
  * [`Cmd.action(actionToDispatch)`](#cmdactionactiontodispatch)
  * [`Cmd.run(func, options)`](#cmdrunfunc-options)
  * [`Cmd.list(cmds, options)`](#cmdlistcmds-options)
  * [`Cmd.map(cmd, higherOrderActionCreator, [...additionalArgs])`](#cmdmapcmd-higherorderactioncreator-additionalargs)
* [`Cmd.getState`](#cmdgetstate)
* [`Cmd.dispatch`](#cmddispatch)
* [`combineReducers(reducersMap)`](#combinereducersreducersmap)
* [`mergeChildReducers(parentResult, action, childMap)`](#mergechildreducersparentresult-action-childmap)

## `install`

#### Notes
`install` applies the store enhancer to Redux's `createStore`. You'll need to
apply it either independently or with `compose` to use redux-loop's features in
your store. redux-loop internally takes over your top level state's shape and
and then decorates `store.getState` in order to provide your app with the state
you are expecting. Due to the way enhancers are composed, you'll need to be
careful about the order in which `install` is applied. Research on how this
ordering affects other enhancers is still under way.


#### Examples
**Applied separately (no other enhancers):**

```js
import { createStore } from 'redux';
import { install } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const store = createStore(reducer, initialState, install());
```

**Applied with other enhancers:**
```js
import { createStore, compose, applyMiddleware } from 'redux';
import someMiddleware from 'some-middleware';
import installOther from 'other-enhancer';
import { install as installReduxLoop } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const enhancer = compose(
  installReduxLoop(),
  applyMiddleware(someMiddleware),
  installOther()
);

const store = createStore(reducer, initialState, enhancer);
```

## `loop(state, cmd): [any, Cmd]`

* `state: any` &ndash; the new store state, like you would normally return from
  a reducer.
* `cmd: Cmd` &ndash; a cmd to run once the current action has been
  dispatched, can be a result of any of the functions available under `Cmd`.
* returns an `Array` pair of the `state` and the `cmd`, to allow for easy
  destructuring as well as a predictable structure for other functionality.

#### Notes

`loop` enables you to run cmds as the result of a particular action being
dispatched. It links synchronous state transitions with expected async state
transitions. When you return a `loop` result from your reducer, the store knows
how to separate cmds from state so cmds are not stored in the state tree
with data.

#### Examples

```js
import { loop, Cmd } from 'redux-loop';

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
        Cmd.action({ type: 'SECOND' })
      );

    case 'SECOND':
      // This result is not a loop, just a plain synchronous state transition.
      // Returning loops from a reducer is optional by branch. The store knows
      // how to examine results and compose cmds into a separate effect tree
      // from the state tree.
      return { ...state, second: true };
  }
}
```

## `liftState(state): [any, Cmd]`

* `state: any` &ndash; an object which may be the state of the redux store, or
  an existing `[any, Cmd]` pair created by `loop()`.

#### Notes

Automatically converts objects to `loop()` results. If the value was created
with `loop()`, then the function behaves as an identity. Otherwise, it is lifted
into a `[any, Cmd]` pair where the effect is `Cmd.none()`. Useful for
forcing reducers to always return a `loop()` result, even if they shortcut to
just the model internally.

#### Example

```js
function reducer(state, action) {
  switch(action.type) {
    case 'LOAD_START':
      return loop(
        { ...state, isLoading: true },
        Cmd.run(apiFetch, {
           successActionCreator: resolveActionCreator,
           failActionCreator: rejectActionCreator,
           args: [action.payload.id]
        })
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
// implementations with `loop(state, Cmd.none())`.
export default compose(reducer, liftState);
```


## `getModel(loop): any`

* `loop: any` &ndash; any object.
* returns the model component of the array if the input is a `[any, Cmd]`
  pair, otherwise returns the input object.

#### Notes

`getModel` lets you extract just the model component of an array returned by
`loop`. It's useful in testing if you need to extract out the model component
to do custom comparisons like `Immutable.is()`.


## `getCmd(loop): Cmd | null`

* `loop: any` &ndash; any object.
* returns the cmd component of the array if the input is a `[any, cCmd]`
  pair, otherwise returns `null`.

#### Notes

`getCmd` lets you extract just the cmd component of an array returned by
`loop`. It's useful in testing if you need to separate the model and cmd and
test them separately.


## `isLoop(object): boolean`
 
 * `object: any` &ndash; any object.
 * returns whether the given object was created with the `loop` function.
 
 #### Notes
 
 `isLoop` lets you determine whether an object returned by a reducer includes an
 cmd. This function is useful for writing custom higher-order functionality on
 top of redux-loop's API, or for just writing your own combineReducers.



## `Cmds`

#### Notes

The `Cmd` object provides access to all of the functions you'll need to
represent different kinds of cmds to redux-loop's cmd processor. Every
cmd is a plain JavaScript object that simply describes to the store how to
process it. Cmd are never executed in the reducer, leaving your reducer pure
and testable.

### `Cmd.none`

#### Simulation
Simulating `none` always returns null.

```js
expect(Cmd.none.simulate()).toBe(null); //parameter is ignored
```

#### Notes

`none` is a no-op effect that you can use for convenience when building custom
effect creators from the ones provided. Since it does not resolve to an action
it doesn't cause any side effects to actually occur.

#### Examples

```js
// The following two expressions are equivalent when processed by the store.

return loop(
  { ...state, someProp: action.payload },
  Cmd.none
);

// ...

return { ...state, someProp: action.payload }
```

### `Cmd.action(actionToDispatch)`

* `actionToDispatch: Action` &ndash; a plain object with a `type` property that the store
  can dispatch.

#### Simulation
Simulating `action` always returns `actionToDispatch`.

```js
const action = {type: 'type', foo: 123};
const cmd = Cmd.action(action);
expect(cmd.simulate()).toEqual(action); //parameter is ignored
```

#### Notes

`action` allows you to schedule a plain action object for dispatch after the
current dispatch is complete. It can be useful for initiating multiple sequences
that run in parallel but don't need to communicate or complete at the same time. 
Make sure your action creator is pure if creating an action from a reducer.

#### Examples

```js
// Once the store has finished updating this part of the state with the new
// result where `someProp` is set to `action.payload` it will schedule another
// dispatch for the action SOME_ACTION.
return loop(
  { ...state, someProp: action.payload },
  Cmd.action({ type: 'SOME_ACTION' })
);
```


### `Cmd.run(func, options)`

* `func: (...Array<any>) => any` &ndash; a function to run
* `options.successActionCreator: (any) => Action` &ndash; an optional function that that takes the
promise resolution value (if func returns a promise) or the return value (if func does not return a promise) and returns an action which will be dispatched.
* `options.failActionCreator: (any) => Action` &ndash; an optional function that that takes the
promise rejection value (if func returns a promise) or the thrown error (if func throws) and returns an action which will be dispatched. This should not be omitted if the function is expected to potentially throw an exception. Exceptions are rethrown if there is no fail handler.
* `options.args: Array<any>` &ndash; an optional array of arguments to call `func` with.
* `options.forceSync: boolean` &ndash; if true, this Cmd will finish synchronously even if func returns a promise. Useful if the Cmd runs as part of a list with batch set to true but you don't care about the result of this Cmd and want the list to finish faster.
* `options.testInvariants: boolean` &ndash; Normally, if your action creators are not functions or args is not an array, an error will be thrown (unless you are in production). You can turn this off in testing environments by using this option. NOTE: ONLY DO THIS IN TESTS. IF YOU DO THIS IN PRODUCTION, IT WILL THROW. This is useful if you want to do something like 

```js
expect(cmd).toEqual(Cmd.run(foo, {
  testInvariants: true,
  successActionCreator: jasmine.any(Function) //replace with your testing library's equivalent matcher
}));
```

because `jasmine.any(Function)` is not a function.

#### Simulation
`Run` cmd simulations pass the result through the correct action creator (depending on the success property passed) and return the resulting action.

If there is no corresponding action creator on the cmd, null is returned.


```js
const cmd = Cmd.run(sideEffect, {
  successActionCreator: result => actionCreator(result, 'hard coded');
});
expect(cmd.simulate({success: true, result: 123})).toEqual(actionCreator(123, 'hard coded'));
expect(cmd.simulate({success: false, result: 123})).toBe(null);
```

#### Notes

`run` allows you to declaratively schedule a function to be called with some
arguments, and dispatch actions based on the results. This
allows you to represent almost any kind of runnable process to the store without
sacrificing functional purity or having to encapsulate implicit state outside
of your reducer. Keep in mind, functions that are handed off to the store with `run`
are never invoked in the reducer, only by the store during your application's
runtime. You can invoke a reducer that returns a `run` effect as many times
as you want and always get the same result by deep-equality without triggering
any side-effect function calls in the process.

By default, if func returns a promise, that's promises's resolution and rejection
values are used in the success and fail action creators (if provided). If func does
not return a promise, the return value is used for the success action creator, and
the fail action creator is only used if an error is thrown. 

If a Run Cmd is used in a list with batch set to true and func returns a promise, the list will not
finish until the returned promise resolves/rejects. If a promise is not returned, the batched list
does not wait. You can prevent waiting for a single long-running asynchronous Cmd by using the forceSync option on that individual Cmd. If you do, you won't be able to use the action creator options to handle the result of the Cmd.

#### Examples

```js
import { loop, Cmd } from 'redux-loop';

function fetchUser(userId) {
  return fetch(`/api/users/${userId}`);
}

function userFetchSuccessfulAction(user) {
  return {
    type: 'USER_FETCH_SUCCESSFUL',
    user
  };
}

function userFetchFailedAction(err) {
  return {
    type: 'USER_FETCH_ERROR',
    err
  };
}

function reducer(state , action) {
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

### `Cmd.list(cmds, options)`

* `cmds: Array<Cmd>` &ndash; an array of cmds returned by any of the
  other cmd functions, or even nested calls to `Cmd.list`.
* `options.sequence: boolean` &ndash; By default, asynchronous Cmds all run immediately and in parallel. If sequence is true, cmds will wait for the previous cmd to resolve before starting. Note: this does not have an effect if all Cmds are synchronous.
* `options.batch: boolean` &ndash; By default, actions from nested cmds will be dispatched as soon as that cmd finishes. If batch is true, no actions will be dispatched until all of the cmds are resolved/finished. The actions will then be dispatched all at once in the order of the original cmd array.
* `options.testInvariants: boolean` &ndash; Normally, if the first parameter to Cmd.list is not an array of Cmds, an error will be thrown (unless you are in production). You can turn this off in testing environments by using this option. NOTE: ONLY DO THIS IN TESTS. IF YOU DO THIS IN PRODUCTION, IT WILL THROW. This is useful if you want to pass a custom object from your test library to verify a subset of `cmds`, such as `jasmine.arrayContaining(someCmd)`.

#### Simulation
Simulating a `list` cmd simulates all of its child cmds and returns an array of the results. The resulting array has nulls filtered out and is flattened. 

To simulate a `list`, pass an array of parameters to be passed to the corresponding cmds for simulation.

```js
const cmd1 = Cmd.run(sideEffect, {
  successActionCreator: result => actionCreator(result, 'hard coded')
});
const cmd2 = Cmd.run(sideEffect, {
  failActionCreator: result => actionCreator2(result, 'foo')
});
const list = Cmd.list([cmd1, cmd2]);
const result = list.simulate([{success: true, result: 123}, {success: false, result: 456}]);
expect(result).toEqual([actionCreator(123, 'hard coded'), actionCreator2(456, 'foo')]);
```

#### Notes

`list` allows you to group cmds as a single cmd to be run all together. Use the options to choose when you want the individual cmds to run and when the resulting actions are dispatched. The default behavior is to run each Cmd and dispatch the results as soon as possible.

#### Examples

```js
import { loop, Cmd } from 'redux-loop';

function reducer(state , action) {
  switch(action.type) {
  case 'INIT':
    return loop(
      {...state, initStarted: true},
      Cmd.list([
        Cmd.run(fetchUser, {
          successActionCreator: userFetchSuccessfulAction
          failActionCreator: userFetchFailedAction,
          args: ['123']
        }),
        Cmd.run(fetchItem, {
          successActionCreator: itemFetchSuccessfulAction,
          failActionCreator: itemFetchFailedAction,
          args: ['456']
        })
      ])
    );

  case 'USER_FETCH_SUCCESSFUL':
    return {...state, user: action.user};
    
  case 'USER_FETCH_FAILED':
    return {...state, userError: action.error};
    
  case 'ITEM_FETCH_SUCCESSFUL':
    return {...state, item: action.item};
    
  case 'ITEM_FETCH_FAILED':
    return {...state, itemError: action.error};
    
  default:
    return state;
  }
}
```

### `Cmd.map(cmd, higherOrderActionCreator, [...additionalArgs])`

* `cmd: Cmd` &ndash; a cmd, the resulting action of which will be
  passed to `higherOrderActionCreator` to be nested into a higher-order action.
* `higherOrderActionCreator` &ndash; an action creator function which will
  accept an action, or optionally some other arguments followed by an action, and
  return a new action in which the previous action was nested.
* `additionalArgs` &ndash; a list of additional arguments to pass to
  `higherOrderActionCreator` before passing in the action from the cmd.

#### Simulation
Simulating a `map` cmd simulates the nested cmd and passes the result through `tagger`. If the result is an array of actions, all of them are passed through `tagger`. If args are provided to the cmd, they are passed to `tagger`.

```js
const cmd1 = Cmd.run(sideEffect, {
  successActionCreator: result => actionCreator(result, 'hard coded')
});

const map = Cmd.map(cmd1, actionCreator2, 'extra arg');
const result = map.simulate({success: true, result: 123});
expect(result).toEqual(actionCreator2('extra arg', actionCreator(123, 'hard coded')));
```

#### Notes

`map` allows you to take an existing cmd from a nested reducer in your
state and lift it to a more general action in which the resulting action is
nested. This enables you to build your reducer in a fractal-like fashion, in
which all of the logic for a particular slice of your state is totally
encapsulated and actions can be simply directed to the reducer for that slice.

If you want to `map` a nested `list` Cmd, it's important to enable the `batch` option on the list. Otherwise, the `list` does not return any of the dispatched actions as they are all dispatched while running the `list` Cmd.

#### Examples

**nestedState.js**
```js
function incrementAsync(amount) {
  return new Promise((resolve) => {
    setTimeout(() => (
      resolve(amount)
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
        Cmd.run(incrementAsync, {
           successActionCreator: incrementSuccessAction,
           failActionCreator: incremenetFailedAction,
           args: [action.payload]
        })
      );
    case 'INCREMENT':
      return loop(
        state + action.payload,
        Cmd.none()
      );
    default:
      return loop(
        state,
        Cmd.none()
      );
  }
}
```

**topState.js**
```js
import nestedReducer from './nestedState';

function nestedAction(action) {
  return { type: 'NESTED_ACTION', payload: action };
}

function reducer(state = { /* ... */ }, action) {
  switch(action.type) {
    // ... other top-level things

    case 'NESTED_ACTION':
      const [model, cmd] = nestedReducer(state.nestedCount, action.payload);
      return loop(
        { ...state, nestedCount: model },
        Cmd.map(cmd, nestedAction)
      );

    default:
      return state;
  }
}
```

## `Cmd.getState`

#### Notes
A symbol that can be passed to a Cmd as an arg (from a reducer) that will be replaced at the time the function is called with the getState method from the store

#### Example

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
         args: [Cmd.getState]
      })
    );
  default:
    return state;
  }
}

//something.js
export function doSomething(getState) {
  let value = getState().some.random.value;
  console.log(value);
}
```

## `Cmd.dispatch`

#### Notes
A symbol that can be passed to a Cmd as an arg (from a reducer) that will be replaced at the time the function is called with the dispatch method from the store

#### Example

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
         args: [Cmd.dispatch]
      })
    );
  default:
    return state;
  }
}

//something.js
export function doSomething(dispatch) {
  let value = someThing();
  if(value === 123) {
    dispatch(valueIs123Action());
  }
  return value;
}
```
  

## `combineReducers(reducersMap)`

* `reducersMap: Object<string, ReducerFunction>` &ndash; a map of keys to nested
  reducers, just like the `combineReducers` you would find in Redux itself.

#### Notes

Reducer composition is key to a clean Redux application. The built-in Redux
`combineReducers` won't work for nested reducers that use `loop`, so we included
one that is aware that some reducers might have side effects. The `combineReducers`
in redux-loop knows how to compose cmds as well as state from nested reducers
so that your effects tree is always separate from your state tree. It's also
completely compatible with the one in Redux, so there should be no issues
switching to this implementation.

#### Examples
```js
import { combineReducers } from 'redux-loop';
import reducerWithSideEffects from './reducer-with-side-effects';
import plainReducer from './plain-reducer';

export default combineReducers({
  withEffects: reducerWithSideEffects,
  plain: plainReducer
});
```

## `mergeChildReducers(parentResult, action, childMap)`

`mergeChildReducers` is a more generalized version of `combineReducers` that allows you to nest reducers
underneath a common parent that has functionality of its own (rather than restricting the parent
to simply passing actions to its children like `combineReducers` does)

* `parentResult: Object | loop(Object, Cmd)` &ndash; The result from the parent reducer before any child results have been applied.
* `action: Action` &ndash; a redux action
* `childMap: Object<string, ReducerFunction>` &ndash; a plain object map of keys to nested reducers, similar
to the map in combineReducers. However, a key can be given a value of null to have it removed from the state.

#### Examples
```js
import {getModel, isLoop, mergeChildReducers} from 'redux-loop';
import pageReducerMap from './page-reducers';

// a simple reducer that keeps track of your current location and nests the correct
//child reducer for that location at state.data

const initialState = {
   location: 'index'
   //data will be filled in with the result of the child reducer
};

function parentReducer(state = initialState, action){
  if(action.type !== 'LOCATION_CHANGE')
     return state;
     
  return {...state, location: action.newLocation};
}

export default function reducer(state, action){
  const parentResult = parentReducer(state, action);
  
  let location;
  if(isLoop(parentResult))
    location = getModel(parentResult).location;
  else
    location = parentResult.location;
   
  const childMap = {data: pageReducerMap[location]};
  
  return mergeChildReducers(parentResult, action, childMap);
}
```