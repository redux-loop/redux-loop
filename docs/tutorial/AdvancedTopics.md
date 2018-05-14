# Advanced topics

## Accessing state and dispatching actions from your Cmds

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

This minimal example will cause perpetual dispatching! While it is also possible
to make this mistake with large, complicated networks of `redux-thunk` action
creators, it is much easier to spot the mistake before it is made. It helps to
keep your reducers small and focused, and use `combineReducers` or manually
compose reducers so that the number of actions you deal with at one time is
small. A small set of actions which initiate a `loop` will help reduce the
likelihood of causing circular dispatches.

## Combining reducers without nesting them

`combineReducers` is great for the case where you want to nest reducers under a common parent. However, sometimes you want to split up reducers but still let them act on the same slice of state. `reduceReducers` lets you do this. It is a loop-friendly version of [the original](https://github.com/redux-utilities/reduce-reducers). It runs multiple reducers over the same piece of state (from left to right) and combines the Cmds in those reducers similar to how combineReducers does.

```js
import {reduceReducers, Cmd, loop, install} from 'redux-loop';
import {createStore} from 'redux';

const addReducer = (state = initialState, {value}) => {
  if(action.type !== 'change'){
    return state;
  }
  return loop({...state, add: state.add + value}, Cmd.run(foo))
};

const multReducer = (state = initialState, {value}) => {
  if(action.type !== 'change'){
    return state;
  }
  return loop({...state, mult: state.mult * value}, Cmd.run(bar))
};

const reducer = reduceReducers(addReducer, multReducer);

const initialState = { add: 5, mult: 7 };
const store = createStore(reducer, initialState, install());

dispatch({type: 'change', value: 6});
// state is { add: 30, mult: 42 }
// foo and bar have run
```

## Using `combineReducers` and `mergeChildReducers` with ImmutableJS and other libraries

It's impossible to write a version of `combineReducers` or `mergeChildReducers` that supports all use cases well.
You may want your parent state to be an array or you may be using a library such as ImmutableJS with non-standard data structures. [Like redux's implementation of combineReducers](http://redux.js.org/docs/recipes/reducers/BeyondCombineReducers.html), redux-loop's are designed to only work with plain JS objects.
Certain implementations may be generic enough to handle many use cases, but chances are that they will be
sub-optimal in most scenarios. For example, when iterating over properties of an Immutable Map to update children, unless you use withMutations, you will create a new parent object for each key that you iterate over and will have worse performance.

For this reason, we have broken out integrations with popular libraries into separate packages.

- [ImmutableJS](https://github.com/redux-loop/redux-loop-immutable) 

If your use case is not currently supported, we encourage you to write your own helpers to compose reducers that fit your specific needs. The only requirement for redux-loop is that they pull the commands out of the child results and batch them together into a single cmd object to be passed along in the resulting loop object.
See the [mergeChildReducers](src/merge-child-reducers.js) and [combineReducers](src/combineReducers.js) implementations for reference.

If you have a popular use case or library that is not currently supported, please file an issue and we can discuss if it makes sense for us to support a custom integration. 

NOTE: reduceReducers does not currently need custom integrations with libraries like immutable. The base version should be generic because it does not make assumptions about the shape of your state.