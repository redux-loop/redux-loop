import { throwInvariant } from './utils';
import { parseRawState } from './parseRawState';

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

const replaceEffectsTag = Symbol('REPLACE_EFFECTS');

/**
 * Lifts a reducer to always return a looped state.
 */
function liftReducer(reducer) {
  return (state, action) => {
    if(action.type === replaceEffectsTag) {
      return action.state;
    }

    return reducer(state, action);
  };
}

/**
 * Installs a new dispatch function which will attempt to execute any effects
 * attached to the current model as established by the original dispatch.
 */
export function install() {
  return (next) => (reducer, initialState) => {
    const store = next(liftReducer(reducer), initialState);
    let replacingEffects = false;

    function dispatch(action) {
      const dispatchedAction = store.dispatch(action);
      const rawState = store.getState();

      replacingEffects = true;
      const { model, effect } = parseRawState(rawState);
      store.dispatch({ type: replaceEffectsTag, state: model });
      replacingEffects = false;
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

    function replaceReducer(r) {
      return store.replaceReducer(liftReducer(r));
    }

    function subscribe(listener) {
      return store.subscribe(() => {
        if (!replacingEffects) listener();
      });
    }

    return {
      ...store,
      dispatch,
      subscribe,
      replaceReducer,
    };
  };
}
