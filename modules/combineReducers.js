import { loop, isLoop, getEffect, getModel } from './loop';
import { batch, none } from './effects';

function optimizeBatch(effects) {
  switch(effects.length) {
    case 0:
      return none();
    case 1:
      return effects[0];
    default:
      return batch(effects);
  }
}

export function combineReducers(reducerMap) {
  return function finalReducer(state = {}, action) {
    let hasChanged = false;
    let effects = [];
    let model = {};

    const reducerMapKeys = Object.keys(reducerMap);
    for (let i = 0; i < reducerMapKeys.length; i++) {
      const key = reducerMapKeys[i];
      const reducer = reducerMap[key];

      const previousStateForKey = state[key];
      let nextStateForKey = reducer(previousStateForKey, action);

      if (isLoop(nextStateForKey)) {
        effects.push(getEffect(nextStateForKey));
        nextStateForKey = getModel(nextStateForKey);
      }

      model[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return loop(
      hasChanged ? model : state,
      optimizeBatch(effects)
    );
  };
}
