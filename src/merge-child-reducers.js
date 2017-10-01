import {loop, isLoop, getModel, getCmd, Cmd} from '../src';

export default function mergeChildReducers(parentResult, action, childMap){
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
    let currentChild = childReducer(prev[key], action);
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

  return loop(newState, getListCmdIfNeeded(cmds)); 
}

function getListCmdIfNeeded(cmds) {
  switch(cmds.length) {
    case 0:
      return Cmd.none;
    case 1:
      return cmds[0];
    default:
      return Cmd.list(cmds);
  }
}