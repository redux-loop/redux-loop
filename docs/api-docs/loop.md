# `loop(state, cmd): [any, Cmd]`

* `state: any` &ndash; the new store state, like you would normally return from
  a reducer.
* `cmd: Cmd` &ndash; a cmd to run once the current action has been
  dispatched, can be a result of any of the functions available under `Cmd`.
* returns an `Array` pair of the `state` and the `cmd`, to allow for easy
  destructuring as well as a predictable structure for other functionality.

## Notes

`loop` enables you to run cmds as the result of a particular action being
dispatched. It links synchronous state transitions with expected async state
transitions. When you return a `loop` result from your reducer, the store knows
how to separate cmds from state so cmds are not stored in the state tree
with data.

## Examples

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
