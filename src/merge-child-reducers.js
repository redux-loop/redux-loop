import { loop, isLoop, getModel, getCmd } from './loop';
import batchCmds from './batch-cmds';

export default function mergeChildReducers(...args) {
  console.warning(
    'mergeChildReducers is deprecated. Use reduceReducers or combineReducers instead.'
  );
  return DEPRECATED_mergeChildReducers(...args);
}

// eslint-disable-next-line camelcase
export function DEPRECATED_mergeChildReducers(
  parentResult,
  action,
  childMap,
  ...args
) {
  let initialState = parentResult,
    parentCmd;
  if (isLoop(initialState)) {
    parentCmd = getCmd(initialState);
    initialState = getModel(initialState);
  }

  let cmds = parentCmd ? [parentCmd] : [];
  let hasChanged = false;

  const newState = Object.keys(childMap).reduce((prev, key) => {
    let childReducer = childMap[key];
    if (!childReducer) {
      if (!hasChanged) {
        prev = { ...prev };
        hasChanged = true;
      }
      delete prev[key];
      return prev;
    }
    let currentChild = childReducer(prev[key], action, ...args);
    if (isLoop(currentChild)) {
      cmds.push(getCmd(currentChild));
      currentChild = getModel(currentChild);
    }

    if (prev[key] !== currentChild && hasChanged) {
      prev[key] = currentChild;
    } else if (prev[key] !== currentChild) {
      prev = { ...prev, [key]: currentChild };
      hasChanged = true;
    }
    return prev;
  }, initialState);

  return loop(newState, batchCmds(cmds));
}
