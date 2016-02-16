import {
  loop,
} from './loop';

import {
  batch,
  none,
  constant,
  promise,
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
  batch,
  none,
  lift,
};

export {
  combineReducers,
  Effects,
  install,
  loop,
};
