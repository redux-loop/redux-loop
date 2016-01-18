import { throwInvariant } from './utils';
import { isEffect } from './effects';

const isLoopSymbol = Symbol('isLoop');

/**
 * Determines if the object was created via `loop()`.
 */
export function isLoop(object) {
  return object[isLoopSymbol];
}

/**
 * Attaches an effect to the model.
 *
 *   function reducerWithSingleEffect(state, action) {
 *     // ...
 *     return loop(
 *       newState,
 *       fetchSomeStuff() // returns a promise
 *     );
 *   }
 *
 *   function reducerWithManyEffectsOneAsyncOneNot(state, action) {
 *     // ...
 *     return loop(
 *       newState,
 *       Promise.all([
 *         fetchSomeStuff(),
 *         Promise.resolve(someActionCreator())
 *       ])
 *     );
 *   }
 */
export function loop(model, effect) {
  if(process.env.NODE_ENV === 'development') {
    throwInvariant(
      isEffect(effect),
      'Given effect is not an effect instance.'
    );
  }

  return {
    model,
    effect,
    [isLoopSymbol]: true
  };
}
