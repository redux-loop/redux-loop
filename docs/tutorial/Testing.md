# Test reducer results

Objects returned by functions from the `Cmd` module are declarative
specifications of the next behavior of the store. They are only processed by
an active store, pushing effecting behavior to the edge of the application.
You can call a reducer as many times with a given action and state and always
get a result which is `deepEqual`.

```js
import test from 'tape';
import reducer, { fetchDetails } from './reducer';
import { loadingStart, loadingSuccess, loadingError } from './actions';
import { Cmd, loop } from 'redux-loop';

test('reducer works as expected', (t) => {
  const state = { loading: false };

  const result = reducer(state, loadingStart(1));

  t.deepEqual(result, loop(
    { loading: true },
    Cmd.run(fetchDetails, {
      successActionCreator: loadingSuccess,
      failActionCreator: loadingError,
      args: [1]
    })
  ));
});
```

> CAVEAT
> For testing sanity, always pass a referenceable function to a cmd.
> Functions curried or bound from the same function with the same arguments are
> not equal within JavaScript, and so are best to avoid if you want to compare
> effects in your tests.

## Simulating cmd objects

Occasionally you may find yourself in a situation where you need to pass more
than one parameter to an action creator, such as:

```js
Cmd.run(foo, {
  successActionCreator: foo => actionCreator(foo, state.blah)
})
```

You can't do a deep equality check on this because the success action creator
is always new. Instead, you can simulate the cmd object to test the action creators.

```js
import { Cmd, getCmd, getModel } from 'redux-loop';
...

let result = reducer(state, action);
expect(getModel(result)).toEqual(whatever);
let cmd = getCmd(result);

//test the rest of the cmd
expect(cmd).toEqual(Cmd.run(foo, {
  testInvariants: true,
  successActionCreator: jasmine.any(Function) //replace with your testing library's equivalent matcher
}));

expect(cmd.simulate({success: true, result: 123})).toEqual(actionCreator(123, state.blah));
expect(cmd.simulate({success: false, result: 123})).toBe(null);

```

You can simulate any cmd object to test the actions returned. Lists take
arrays of simulations for their child cmds.

[See detailed documentation about simulating Cmds](docs/api-docs/cmds.md)
