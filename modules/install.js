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
  isNone,
  isEffect,
  effectToPromise,
} from './effects';

/**
 * Installs a new dispatch function which will attempt to execute any effects
 * attached to the current model as established by the original dispatch.
 */
export function install() {
  return (next) => (reducer, initialState, enhancer) => {
    const [initialModel, initialEffect] = liftState(initialState);
    let currentEffect = initialEffect;
    const effectsQueue = [];

    const addToQueue = (effect) => { effectsQueue.push(effect); };

    const removeFromQueue = (effect) => {
      const effectIndex = effectsQueue.indexOf(effect);
      if (effectIndex !== -1) {
        effectsQueue.splice(effectIndex, 1);
      }
    };

    const isEffectsQueueEmpty = () => {
      return isNone(currentEffect) && effectsQueue.length === 0;
    }

    const liftReducer = (reducer) => (state, action) => {
      const result = reducer(state, action);
      const [model, effect] = liftState(result);
      currentEffect = effect;
      return model;
    };

    const store = next(liftReducer(reducer), initialModel, enhancer);

    const runEffect = (originalAction, effect) => {
      const effectPromise = effectToPromise(effect)
        .then((actions) => {
          const lastActionIndex = actions.length - 1;
          return Promise.all(actions.map((action, index) => {
            // In the end of actions sequence we consider the effect resolved
            // for queue to be empty after next dispatch
            if (index === lastActionIndex) {
              removeFromQueue(effectPromise);
            }

            return dispatch(action);
          }));
        })
        .catch((error) => {
          console.error(loopPromiseCaughtError(originalAction.type));
          throw error;
        });

      if (!isNone(effect)) {
        addToQueue(effectPromise);
      }

      return effectPromise;
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
      isEffectsQueueEmpty
    };
  };
}
