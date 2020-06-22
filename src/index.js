import { loop, liftState, getModel, getCmd, isLoop } from './loop';

import Cmd from './cmd';

import { install } from './install';

import c from './combine-reducers';
import m, {
  DEPRECATED_mergeChildReducers as mergeChildReducersWithNoWarning
} from './merge-child-reducers';
import r from './reduce-reducers';

//by exporting functions, these are able to be spied on
//should be unnecessary after https://github.com/rollup/rollup/issues/826
export function combineReducers(...args) {
  return c(...args);
}
// eslint-disable-next-line camelcase
export function DEPRECATED_mergeChildReducers(...args) {
  return mergeChildReducersWithNoWarning(...args);
}

export function mergeChildReducers(...args) {
  return m(...args);
}
export function reduceReducers(...args) {
  return r(...args);
}

export { Cmd, install, loop, liftState, getModel, getCmd, isLoop };
