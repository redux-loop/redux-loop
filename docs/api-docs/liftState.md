# `liftState(state): [any, Cmd]`

* `state: any` &ndash; an object which may be the state of the redux store, or
  an existing `[any, Cmd]` pair created by `loop()`.

## Notes

Automatically converts objects to `loop()` results. If the value was created
with `loop()`, then the function behaves as an identity. Otherwise, it is lifted
into a `[any, Cmd]` pair where the effect is `Cmd.none`. Useful for
forcing reducers to always return a `loop()` result, even if they shortcut to
just the model internally.

## Example

```js
import { compose } from 'redux';
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
// implementations with `loop(state, Cmd.none)`.
export default compose(liftState, reducer);
```
