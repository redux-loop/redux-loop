import {
  loop,
} from './loop';

import {
  batch,
  none,
  constant,
  promise,
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
  batch,
  none,
};

export {
  combineReducers,
  Effects,
  install,
  loop,
};
