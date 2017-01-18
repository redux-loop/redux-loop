import { throwInvariant } from './utils';
import { isEffect, none } from './effects';


/**
 * Determines if the object is an array created via `loop()`.
 */
export const isLoop = (array) => {
  return Array.isArray(array) && array.length === 2 && isEffect(array[1]);
};


/**
 * Returns the effect from the loop if it is a loop, otherwise null
 */
export const getEffect = (loop) => {
  if (!isLoop(loop)) {
    return null;
  }

  return loop[1];
}


/**
 * Returns the model from the loop if it is a loop, otherwise identity
 */
export const getModel = (loop) => {
  if (!isLoop(loop)) {
    return loop;
  }

  return loop[0];
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
export const loop = (model, effect) => {
  if(process.env.NODE_ENV === 'development') {
    throwInvariant(
      isEffect(effect),
      'Given effect is not an effect instance.'
    );
  }

  return [model, effect];
}

/**
* Lifts a state to a looped state if it is not already.
*/
export const liftState = (state) => {
  return isLoop(state) ?
    state :
    loop(state, none());
}
