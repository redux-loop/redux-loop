# Migrating to Redux Loop

## From Redux Thunk
To ease the migration from redux-thunk to redux-loop, you can enable an option to allow redux-loop to handle thunks just like redux-thunk would.

```js
const store = createStore(
  finalReducer,
  initialState,
  install({ ENABLE_THUNK_MIGRATION: true })
);

function doubleThunk(dispatch, getState) {
  const oldState = getState();
  return new Promise(resolve => {
    setTimeout(() => {
      dispatch({ type: 'REPLACE_STATE', value: 2 * oldState });
      resolve();
    }, 1000);
  });
};

store.dispatch(doubleThunk).then(() => {
  console.log('state is now doubled');
});
```