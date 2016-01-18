import { throwInvariant } from './utils';

import {
  loop,
  isLoop,
} from './loop';

import {
  batch,
  none,
  isEffect,
  effectToPromise,
} from './effects';

/**
 * Lifts a state to a looped state if it is not already.
 */
function liftState(state) {
  return isLoop(state) ?
    state :
    loop(state, none());
}

/**
 * Lifts a reducer to always return a looped state.
 */
function liftReducer(reducer) {
  return (state, action) => {
    const result = reducer(state.model, action);
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
      const { effect } = store.getState();
      return runEffect(action, effect).then(() => {});
    }

    function runEffect(originalAction, effect) {
      return effectToPromise(effect)
        .then((actions) => {
          const materializedActions = [].concat(actions).filter(a => a);
          return Promise.all(materializedActions.map(dispatch));
        })
        .catch((error) => {
          console.error(
            `loop Promise caught when returned from action of type ${originalAction.type}.` +
            '\nloop Promises must not throw!'
          );
          throw error;
        });
    }

    function getState() {
      return store.getState().model;
    }

    function replaceReducer(r) {
      return store.replaceReducer(liftReducer(r));
    }

    runEffect({ type: "@@ReduxLoop/INIT" }, liftedInitialState.effect);

    return {
      ...store,
      getState,
      dispatch,
      replaceReducer,
    };
  };
}
