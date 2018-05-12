import { loop, isLoop, getCmd, getModel } from './loop'
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

//TODO: change to be implemented using mergeChildReducers in 5.0
// export default function combineReducers(childMap){
//   return (rootState = {}, action) => {
//     return mergeChildReducers(rootState, action, childMap);
//   };
// }

export const combineReducers = (
  reducerMap,
  rootState,
  accessor,
  mutator
) => {
  if(accessor || mutator || rootState){
    console.warn(`Passing customization parameters to combineReducers is deprecated. They will be removed in 5.0. 
      Integrations with popular libraries are being broken out into separate libraries. 
      Please see https://github.com/redux-loop/redux-loop/releases/tag/v4.2.0 for more details.`)
  }
  rootState = rootState || {};
  accessor = accessor || defaultAccessor;
  mutator = mutator || defaultMutator;

  return (state = rootState, action) => {
    let hasChanged = false
    let cmds = []

    const model = Object.keys(reducerMap).reduce((model, key) => {
      const reducer = reducerMap[key]
      const previousStateForKey = accessor(state, key)
      let nextStateForKey = reducer(previousStateForKey, action)

      if (isLoop(nextStateForKey)) {
        cmds.push(getCmd(nextStateForKey))
        nextStateForKey = getModel(nextStateForKey)
      }

      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
      return mutator(model, key, nextStateForKey)
    }, state)

    return loop(
      hasChanged ? model : state,
      Cmd.list(cmds, {batch: true}) //todo: remove batch in 5.0
    )
  }
}