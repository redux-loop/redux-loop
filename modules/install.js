import { throwInvariant } from './utils';
import { loopPromiseCaughtError } from './errors';

import {
  loop,
  getEffect,
  getModel,
  isLoop,
  liftState,
} from './loop';

import {
  batch,
  none,
  isEffect,
  effectToPromise,
} from './effects';

/**
 * Lifts a reducer to always return a looped state.
 */
function liftReducer(reducer) {
  return (state, action) => {
    const result = reducer(getModel(state), action);
    return liftState(result);
  };
}

/**
 * Installs a new dispatch function which will attempt to execute any effects
 * attached to the current model as established by the original dispatch.
 */
export function install() {
  return (next) => (reducer, initialState) => {
    const liftedInitialState = liftState(initialState);
    const store = next(liftReducer(reducer), liftedInitialState);

    function dispatch(action) {
      const dispatchedAction = store.dispatch(action);
      const effect = getEffect(store.getState());
      return runEffect(action, effect).then(() => {});
    }

    function runEffect(originalAction, effect) {
      return effectToPromise(effect)
        .then((actions) => {
          const materializedActions = actions;
          return Promise.all(materializedActions.map(dispatch));
        })
        .catch((error) => {
          console.error(loopPromiseCaughtError(originalAction.type));
          throw error;
        });
    }

    function getState() {
      return getModel(store.getState());
    }

    function replaceReducer(r) {
      return store.replaceReducer(liftReducer(r));
    }

    runEffect({ type: "@@ReduxLoop/INIT" }, getEffect(liftedInitialState));

    return {
      ...store,
      getState,
      dispatch,
      replaceReducer,
    };
  };
}
