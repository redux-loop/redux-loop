import * as Redux from 'redux';

import { loopPromiseCaughtError } from './errors';


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
        effect
          .toPromise()
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


export class Effects {
  constructor(promiseCreator) {
    this._promiseCreator = promiseCreator;
  }

  static fromLazyPromise(promiseCreator) {
    return new Effects(promiseCreator);
  }

  map(fn) {
    return new Effects(() => this._promiseCreator().then(fn));
  }

  toPromise() {
    return this._promiseCreator();
  }
}