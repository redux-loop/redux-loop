const isLoopSymbol = Symbol('isLoop');
const isEffectSymbol = Symbol('isEffect');

const effectTypes = {
  PROMISE: 'PROMISE',
  BATCH: 'BATCH',
  CONSTANT: 'CONSTANT',
  NONE: 'NONE',
};

/**
 * Throws with message if condition is false.
 */
function throwInvariant(condition, message) {
  if(!condition) {
    throw Error(message);
  }
}

/**
 * Determines if the object was created with an effect creator.
 */
function isEffect(object) {
  return object[isEffectSymbol];
}

/**
 * Determines if the object was created via `loop()`.
 */
function isLoop(object) {
  return object[isLoopSymbol];
}

/**
 * Runs an effect and returns the Promise for its completion.
 */
function effectToPromise(effect) {
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
 * Lifts a state to a looped state if it is not already.
 */
function liftState(state) {
  return isLoop(state) ?
    state :
    loop(state, none());
}

/**
 * Lifts a reducer to always return a looped state.
 */
function liftReducer(reducer) {
  return (state, action) => {
    const result = reducer(state.model, action);
    return liftState(result);
  };
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
 * Installs a new dispatch function which will attempt to execute any effects
 * attached to the current model as established by the original dispatch.
 */
export function installReduxLoop() {
  return (next) => (reducer, initialState) => {

    const store = next(liftReducer(reducer), liftState(initialState));

    function dispatch(action) {
      const dispatchedAction = store.dispatch(action);
      const { effect } = store.getState();
      return runEffect(action, effect).then(() => {});
    }

    function runEffect(originalAction, effect) {
      return effectToPromise(effect)
        .then((actions) => {
          const materializedActions = [].concat(actions).filter(a => a);
          return Promise.all(materializedActions.map(dispatch));
        })
        .catch((error) => {
          console.error(
            `loop Promise caught when returned from action of type ${originalAction.type}.
            loop Promises must not throw!`
          );
          throw error;
        });
    }

    function getState() {
      return store.getState().model;
    }

    function replaceReducer(r) {
      return store.replaceReducer(liftReducer(r));
    }

    const initialEffect = liftState(initialState).effect;
    runEffect({ type: "@@ReduxLoop/INIT" }, initialEffect);

    return {
      ...store,
      getState,
      dispatch,
      replaceReducer,
    };
  };
}

export default {
  constant,
  promise,
  batch,
  none,
  loop,
  installReduxLoop,
};
