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

const defaultAccessor = (state, key) => {
  return state[key];
};

const defaultMutator = (state, key, value) => {
  return {
    ...state,
    [key]: value
  };
};

export function combineReducers(
    reducerMap,
    rootState = {},
    accessor = defaultAccessor,
    mutator = defaultMutator
) {
    return function finalReducer(state = rootState, action) {
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

        return loop(
            hasChanged ? model : state,
            optimizeBatch(effects)
        );
    };
}
