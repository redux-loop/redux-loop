const concat = Array.prototype.concat;

export const flatten = (array) => {
  return concat.apply([], array);
};

export const flatMap = (array, mapFn) => {
  return array.reduce((nextArray, cur) => nextArray.concat(mapFn(cur)), []);
};

export const throwInvariant = (condition, message) => {
  if (!condition) {
    throw Error(message);
  }
};

export const isPromiseLike = (obj) => {
  return !!obj && typeof obj === 'object' && typeof obj.then === 'function';
};
