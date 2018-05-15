# `combineReducers(reducersMap)`

* `reducersMap: Object<string, ReducerFunction>` &ndash; a map of keys to nested
  reducers, just like the `combineReducers` you would find in Redux itself.

## Notes

Reducer composition is key to a clean Redux application. The built-in Redux
`combineReducers` won't work for nested reducers that use `loop`, so we
included one that is aware that some reducers might have side effects. The
`combineReducers` in redux-loop knows how to compose `cmd` objects as well as
state objects from nested reducers so that your effects-tree is always
separate from your state-tree. Redux-loop's `combineReducers` function is
completely compatible with the one from Redux, so there should be no issues
switching to this implementation (if, for example, something out of your
control is using Redux's `combineReducers` method and does not generate cmd
objects).

## Examples

### Standard example

```js
import { combineReducers } from 'redux-loop';
import reducerWithSideEffects from './reducer-with-side-effects';
import plainReducer from './plain-reducer';

export default combineReducers({
  withEffects: reducerWithSideEffects,
  plain: plainReducer
});
```

### Passing extra params
If you pass extra parameters to the reducer returned by combineReducers, they will be passed through to each nested reducer.

```js
function reducer1(state = {}, action, arg){
  console.log(arg);
  return state;
}

function reducer2(state = {}, action, arg){
  console.log(arg); 
  return state;
}

const reducer = combineReducers({reducer1, reducer2});
reducer(undefined, {type: 'foo'}, 'abc');
//abc will be logged twice (once for reducer1 and once for reducer2)
```

### Using Immutable.js

If you're using
[immutable.js](https://github.com/facebook/immutable-js/) with your reducer,
you'll want to use the ImmutableJS version of combineReducers from the [redux-loop-immutable](https://github.com/redux-loop/redux-loop-immutable) package. It has the same API as the non-immutable version except that the state it returns is an Immutable `Map` instead of an `Object`.

```js
import { combineReducers } from 'redux-loop-immutable';
import reducerWithSideEffects from './reducer-with-side-effects';
import plainReducer from './plain-reducer';

export default combineReducers({
  withEffects: reducerWithSideEffects,
  plain: plainReducer
});
```
