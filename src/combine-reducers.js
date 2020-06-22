import { loop, isLoop, getModel, getCmd } from './loop';
import batchCmds from './batch-cmds';

export default function combineReducers(childMap) {
  return (rootState = {}, action, ...args) => {
    let cmds = [];
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
    }, rootState);

    return loop(newState, batchCmds(cmds));
  };
}
