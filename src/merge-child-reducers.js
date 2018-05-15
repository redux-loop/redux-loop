import {loop, isLoop, getModel, getCmd} from './loop';
import Cmd from './cmd';

export default function mergeChildReducers(parentResult, action, childMap, ...args){
  let initialState = parentResult, parentCmd;
  if(isLoop(initialState)){
    parentCmd = getCmd(initialState);
    initialState = getModel(initialState);
  }

  let cmds = parentCmd ? [parentCmd] : [];
  let hasChanged = false;

  const newState = Object.keys(childMap).reduce((prev, key) =>{
    let childReducer = childMap[key];
    if(!childReducer){
      if(!hasChanged){
        prev = {...prev};
        hasChanged = true;
      }
      delete prev[key];
      return prev;
    }
    let currentChild = childReducer(prev[key], action, ...args);
    if(isLoop(currentChild)){
      cmds.push(getCmd(currentChild));
      currentChild = getModel(currentChild);
    }

    if(prev[key] !== currentChild && hasChanged){
      prev[key] = currentChild;
    }
    else if(prev[key] !== currentChild){
      prev = {...prev, [key]: currentChild};
      hasChanged = true;
    }
    return prev;
  }, initialState);

  return loop(newState, batchCmds(cmds)); 
}

export const batchCmds = cmds => {
  switch(cmds.length) {
    case 0:
      return Cmd.none;
    case 1:
      return cmds[0];
    default:
      return Cmd.list(cmds);
  }
}