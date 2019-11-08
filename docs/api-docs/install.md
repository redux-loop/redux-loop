# `install(config)`

* `config: Object<string, Boolean>` &ndash; an optional map of config values to override default
 redux-loop configs
  * `DONT_LOG_ERRORS_ON_HANDLED_FAILURES`: set to false by default. This means that by default, redux-loop will log errors in your effects even if you pass in a failActionCreator to a command (passing in a failActionCreator does not swallow errors like how `catch` is used for Promises).
  * `ENABLE_THUNK_MIGRATION`: Set to false by default. If enabled, you can dispatch thunks and redux-loop will handle them like redux-thunk.

## Notes

`install` applies the store enhancer to Redux's `createStore`. You'll need to
apply it either independently or with `compose` to use redux-loop's features in
your store. redux-loop internally takes over your top level state's shape and
and then decorates `store.getState` in order to provide your app with the state
you are expecting. Due to the way enhancers are composed, you'll need to be
careful about the order in which `install` is applied. Research on how this
ordering affects other enhancers is still under way.


## Examples

### Applied separately (no other enhancers)

```js
import { createStore } from 'redux';
import { install } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const store = createStore(reducer, initialState, install());
```

### Applied with other enhancers

```js
import { createStore, compose, applyMiddleware } from 'redux';
import someMiddleware from 'some-middleware';
import installOther from 'other-enhancer';
import { install as installReduxLoop } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const enhancer = compose(
  installReduxLoop(),
  applyMiddleware(someMiddleware),
  installOther()
);

const store = createStore(reducer, initialState, enhancer);
```

### With config option to not log errors on handled failures
```js
import { createStore } from 'redux';
import { install } from 'redux-loop';
import reducer from './reducer';
const initialState = { /* ... */ };

const config = { DONT_LOG_ERRORS_ON_HANDLED_FAILURES: true };
const store = createStore(reducer, initialState, install(config));
const reducer = combineReducers({reducer1, reducer2});
reducer(undefined, {type: 'foo'}, 'abc');
```
