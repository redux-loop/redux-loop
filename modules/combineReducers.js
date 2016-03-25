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

export function combineReducers(
    reducerMap, rootState = {}, 
    accessor = (child, key) => child[key],
    mutator = (child, key, value) => { child[key] = value; return child; }
) {
    return function finalReducer(state = {}, action) {
        let hasChanged = false;
        let effects = [];

        const model = Object.keys(reducerMap).reduce((model, key) => {
            const reducer = reducerMap[key];
            const previousStateForKey = accessor(state, key);
            let nextStateForKey = reducer(previousStateForKey, action);

            if (isLoop(nextStateForKey)) {
                effects.push(getEffect(nextStateForKey));
                nextStateForKey = getModel(nextStateForKey);
            }

            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
            return mutator(model, key, nextStateForKey);
        }, rootState);

        console.log(model);

        return loop(
            hasChanged ? model : state,
            optimizeBatch(effects)
        );
    };
}
