# redux-loop

Sequence your effects more naturally by returning them from your reducer.

## Example

```javascript
import { createStore } from 'redux';
import { installReduxLoop, loop } from 'redux-loop';
import { fromJS } from 'immutable';

const firstAction = {
  type: 'FIRST_ACTION',
};

const doSecondAction = () => new Promise((resolve) => {
  setTimeout(() => {
    resolve({
      type: 'SECOND_ACTION',
    });
  });
});

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
    // dispatched in the order they are passed to Promise.all
    return loop(
      state.set('firstRun', true),
      Promise.all([
        doSecondAction(),
        thirdAction
      ])
    );

  case 'SECOND_ACTION':
    return state.set('secondRun', true);

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
    // { firstRun: true, secondRun: true, thirdRun: true }
    console.log(store.getState().toJS());
  });
```
