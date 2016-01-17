# redux-loop

Sequence your effects more naturally by returning them from your reducer.

## Example

```javascript
import { createStore } from 'redux';
import Loop, { installReduxLoop, loop } from 'redux-loop';
import { fromJS } from 'immutable';

const firstAction = {
  type: 'FIRST_ACTION',
};

const doSecondAction = (value) => {
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'SECOND_ACTION',
        payload: value,
      });
    });
  });
}

const thirdAction = {
  type: 'THIRD_ACTION',
};

// immutable store state allowed by default, but not required
const initialState = fromJS({
  firstRun: false,
  secondRun: false,
  thirdRun: false,
});

function reducer(state, action) {
  switch(action.type) {

  case 'FIRST_ACTION':
    // Enter a sequence at FIRST_ACTION, SECOND_ACTION and THIRD_ACTION will be
    // dispatched in the order they are passed to batch
    return loop(
      state.set('firstRun', true),
      Loop.batch([
        Loop.promise(doSecondAction, 'hello'),
        Loop.constant(thirdAction)
      ])
    );

  case 'SECOND_ACTION':
    return state.set('secondRun', action.payload);

  case 'THIRD_ACTION':
    return state.set('thirdRun', true);

  default:
    return state;
  }
}

const store = installReduxLoop()(createStore)(reducer, initialState);

store
  .dispatch(firstAction);
  .then(() => {
    // dispatch returns a promise for when the current sequence is complete
    // { firstRun: true, secondRun: 'hello', thirdRun: true }
    console.log(store.getState().toJS());
  });
```
