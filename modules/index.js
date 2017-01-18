import * as Redux from 'redux';

import { loopPromiseCaughtError } from './errors';
import * as Effects from './effects';

export {
  Effects,
};

export function createStore(reducer, initialModel, enhancer) {
  return (function () {
    let queue = []

    function liftReducer(reducer) {
      return (state, action) => {
        const ret = reducer(state, action)

        ret.effects.forEach((effect) => queue.push(effect))

        return ret.state
      }
    }

    const store = Redux.createStore(
      liftReducer(reducer),
      initialModel.state,
      enhancer,
    )

    function executeEffects(callback, effects) {
      return effects.map(effect =>
        Effects
          .toPromise(effect)
          .then(callback)
          .catch(err => {
            throw loopPromiseCaughtError;
            console.error(err);
          })
      );
    }

    function enhancedDispatch(action) {
      store.dispatch(action)

      const currentQueue = queue;
      queue = []

      return Promise.all(
        executeEffects(enhancedDispatch, currentQueue)
      );
    }

    executeEffects(enhancedDispatch, initialModel.effects)

    const enhancedReplaceReducer = (reducer) => {
      return store.replaceReducer(liftReducer(reducer));
    };

    return {
      ...store,
      dispatch: enhancedDispatch,
      replaceReducer: enhancedReplaceReducer,
    };
  })();
}