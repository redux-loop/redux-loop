# `reduceReducers(...reducers)`

* `reducers` &ndash; Reducers that you want to merge from left to right without nesting, similar to [the original](https://github.com/redux-utilities/reduce-reducers), but with support for Cmds.

## Notes

For an explanation of why `reduceReducers` is useful, see [this Stack Overflow post](https://stackoverflow.com/questions/38652789/correct-usage-of-reduce-reducers/44371190#44371190).

## Examples

### Standard example

```js
import { reduceReducers } from 'redux-loop';
import reducerWithSideEffects from './reducer-with-side-effects';
import plainReducer from './plain-reducer';

export default reduceReducers(reducerWithSideEffects, plainReducer);
```

### Passing extra params
If you pass extra parameters to the reducer returned by combineReducers, they will be passed through to each nested reducer.

```js
function reducer1(state = {}, action, arg){
  console.log(arg);
  return state;
}

function reducer2(state, action, arg){
  console.log(arg); 
  return state;
}

const reducer = reduceReducers(reducer1, reducer2);
reducer(undefined, {type: 'foo'}, 'abc');
//abc will be logged twice (once for reducer1 and once for reducer2)
```