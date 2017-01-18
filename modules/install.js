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
  isNone,
  effectToPromise,
} from './effects';

/**
 * Installs a new dispatch function which will attempt to execute any effects
 * attached to the current model as established by the original dispatch.
 */
export function install() {
  return (next) => (reducer, initialState, enhancer) => {
    let currentEffect = none();
    const [initialModel, initialEffect] = liftState(initialState);

    const liftReducer = (reducer) => (state, action) => {
      const result = reducer(state, action);
      const [model, effect] = liftState(result);
      if (isNone(currentEffect)) {
        currentEffect = effect
      } else {
        currentEffect = batch([currentEffect, effect]);
      }
      return model;
    };

    const store = next(liftReducer(reducer), initialModel, enhancer);

    const runEffect = (originalAction, effect) => {
      return effectToPromise(effect)
        .then((actions) => {
          return Promise.all(actions.map(dispatch));
        })
        .catch((error) => {
          console.error(loopPromiseCaughtError(originalAction.type));
          throw error;
        });
    };

    const dispatch = (action) => {
      store.dispatch(action);
      const effectToRun = currentEffect;
      currentEffect = none();
      return runEffect(action, effectToRun);
    };

    const replaceReducer = (reducer) => {
      return store.replaceReducer(liftReducer(reducer));
    };

    runEffect({ type: '@@ReduxLoop/INIT' }, initialEffect);

    return {
      ...store,
      dispatch,
      replaceReducer,
    };
  };
}
