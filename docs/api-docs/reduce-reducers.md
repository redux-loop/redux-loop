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