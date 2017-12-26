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

## Nest reducers inside parents with their own functionality

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

`combineReducers` just returns a reducer with a specific usage of
`mergeChildReducers` (one in which the child map never changes, the parent
state is an empty object, and all children always get called). By using
`mergeChildReducers` in your reducer, you can choose which children are used
when and under what key names.

By using `combineReducers` or `mergeChildReducers` everywhere your reducer
tree nests, all cmd objects resulting from a single dispatched action will
always be batched up into a single Cmd at the top of the tree and processed
correctly by the store.

## Using `combineReducers` and `mergeChildReducers` with ImmutableJS and other libraries

It's impossible to write a version of `combineReducers` or `mergeChildReducers` that supports all use cases well.
You may want your parent state to be an array or you may be using a library such as ImmutableJS with non-standard data structures. [Like redux's implementation of combineReducers](http://redux.js.org/docs/recipes/reducers/BeyondCombineReducers.html), redux-loop's are designed to only work with plain JS objects.
Certain implementations may be generic enough to handle many use cases, but chances are that they will be
sub-optimal in most scenarios. For example, when iterating over properties of an Immutable Map to update children,
unless you use withMutations, you will create a new parent object for each key that you iterate over and will
have worse performance.

For this reason, we have broken out integrations with popular libraries into separate packages.

- [ImmutableJS](https://github.com/redux-loop/redux-loop-immutable)

If your use case is not currently supported, we encourage you to write your own helpers to compose reducers that
fit your specific needs. The only requirement for redux-loop is that they pull the commands out of the child results and batch them together into a single cmd object to be passed along in the resulting loop object.
See the [mergeChildReducers](src/merge-child-reducers.js) and [combineReducers](src/combineReducers.js) implementations for reference.

If you have a popular use case or library that is not currently supported, please file an issue and we can discuss if it makes sense for us to support a custom integration. 
