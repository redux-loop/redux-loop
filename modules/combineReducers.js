import { loop, isLoop } from './loop';
import { batch, none } from './effects';
import { mapValues } from './utils';

function optimizeBatch(effects) {
  switch(effects.length) {
    case 0:
      return none();
    case 1:
      return effects[0];
    default:
      batch(effects);
  }
}

export function combineReducers(reducerMap) {
  return function finalReducer(state, action) {
    const effects = [];
    let hasChanged = false;

    const model = mapValues(reducerMap, (reducer, key) => {
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      if (isLoop(nextStateForKey)) {
        effects.push(nextStateForKey.effect);
        hasChanged = hasChanged || nextStateForKey.model !== previousStateForKey;
        return nextStateForKey.model;
      } else {
        hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        return nextStateForKey;
      }
    });

    return loop(
      hasChanged ? model : state,
      optimizeBatch(effects)
    );
  };
}
