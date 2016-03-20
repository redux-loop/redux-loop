import {
  loop,
  liftState,
  getModel,
  getEffect,
} from './loop';

import {
  batch,
  none,
  constant,
  promise,
  call,
  lift,
} from './effects';

import {
  install,
} from './install';

import {
  combineReducers,
} from './combineReducers';


const Effects = {
  constant,
  promise,
  call,
  batch,
  none,
  lift,
};

export {
  combineReducers,
  Effects,
  install,
  loop,
  liftState,
  getModel,
  getEffect,
};
