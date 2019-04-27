import mergeChildReducers from './merge-child-reducers';

export default function combineReducers(childMap) {
  return (rootState = {}, action, ...args) => {
    return mergeChildReducers(rootState, action, childMap, ...args);
  };
}
