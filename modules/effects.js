import { throwInvariant } from './utils';

const isEffectSymbol = Symbol('isEffect');

const effectTypes = {
  PROMISE: 'PROMISE',
  BATCH: 'BATCH',
  CONSTANT: 'CONSTANT',
  NONE: 'NONE',
};

/**
* Runs an effect and returns the Promise for its completion.
*/
export function effectToPromise(effect) {
  if(process.env.NODE_ENV === 'development') {
    throwInvariant(
      isEffect(effect),
      'Given effect is not an effect instance.'
    );
  }

  switch (effect.type) {
    case effectTypes.PROMISE:
      return effect.factory(...effect.args);
    case effectTypes.BATCH:
      return Promise.all(effect.effects.map(effectToPromise));
    case effectTypes.CONSTANT:
      return Promise.resolve(effect.action);
    case effectTypes.NONE:
      return Promise.resolve();
  }
}

/**
 * Determines if the object was created with an effect creator.
 */
export function isEffect(object) {
  return object[isEffectSymbol];
}

/**
 * Creates a noop effect.
 */
export function none() {
  return {
    type: effectTypes.NONE,
    [isEffectSymbol]: true
  };
}

/**
 * Creates an effect for a function that returns a Promise.
 */
export function promise(factory, ...args) {
  return {
    factory,
    args,
    type: effectTypes.PROMISE,
    [isEffectSymbol]: true
  };
}

/**
 * Composes an array of effects together.
 */
export function batch(effects) {
  return {
    effects,
    type: effectTypes.BATCH,
    [isEffectSymbol]: true
  };
}

/**
 * Creates an effect for an already-available action.
 */
export function constant(action) {
  return {
    action,
    type: effectTypes.CONSTANT,
    [isEffectSymbol]: true
  };
}