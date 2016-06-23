import { loop, isLoop, getEffect, getModel } from './loop'
import Cmd from './cmd'


const defaultAccessor = (state, key) => {
  return state[key]
};

const defaultMutator = (state, key, value) => {
  return {
    ...state,
    [key]: value,
  };
};

export const combineReducers = (
  reducerMap,
  rootState = {},
  accessor = defaultAccessor,
  mutator = defaultMutator
) => {
  return const finalReducer = (state = rootState, action) => {
    let hasChanged = false
    let effects = []

    const model = Object.keys(reducerMap).reduce((model, key) => {
      const reducer = reducerMap[key]
      const previousStateForKey = accessor(state, key)
      let nextStateForKey = reducer(previousStateForKey, action)

      if (isLoop(nextStateForKey)) {
        effects.push(getEffect(nextStateForKey))
        nextStateForKey = getModel(nextStateForKey)
      }

      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
      return mutator(model, key, nextStateForKey)
    }, rootState)

    return loop(
      hasChanged ? model : state,
      Cmd.batch(effects)
    )
  }
}
