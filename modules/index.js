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


const Effects = {
  constant,
  promise,
  batch,
  none,
};

export {
  Effects,
  install,
  loop,
};
