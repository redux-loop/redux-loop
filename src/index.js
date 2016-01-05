const isLoopSymbol = Symbol('isLoop');

/**
 * Discretely attaches a promise to the model as an effect
 *
 *   function reducerWithSingleEffect(state, action) {
 *     // ...
 *     return loop(
 *       newState,
 *       fetchSomeStuff() // returns a promise
 *     );
 *   }
 *
 *   function reducerWithManyEffects(state, action) {
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

  if(typeof effect.then !== 'function') {
    throw Error('Given effect is not a Promise instance');
  }

  return {
    model,
    effect,
    [isLoopSymbol]: true
  };
}

/**
 * Determines if the object was created via `loop()`.
 */
function isLoop(state) {
  return state[isLoopSymbol];
}

/**
 * Lifts a state to a looped state if it is not already
 */
function liftState(state) {
  return isLoop(state) ? state : loop(state, Promise.resolve());
}

/**
 * Lifts a reducer to always return a looped state
 */
function liftReducer(reducer) {
  return (state, action) => {
    const result = reducer(state.model, action);
    return liftState(result);
  }
}

/**
 * Installs a new dispatch function which will attempt to execute any effects
 * attached to the current model as established by the original dispatch.
 */
export function installReduxLoop() {
  return (next) => (reducer, initialState) => {

    const store = next(liftReducer(reducer), liftState(initialState));

    function dispatch(action) {
      console.log('dispatching');
      const dispatchedAction = store.dispatch(action);
      const { effect } = store.getState();
      return runEffect(action, effect).then(() => {});
    }

    function runEffect(originalAction, effect) {
      return effect
        .then((actions) => {
          const materializedActions = [].concat(actions).filter(a => a);
          return Promise.all(materializedActions.map(dispatch));
        })
        .catch((error) => {
          console.error(
            `Loopback Promise caught when returned from action of type ${originalAction.type}.
             Loopback Promises must not throw!`
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
    if(initialEffect) {
      runEffect({ type: "@@ReduxLoop/INIT" }, initialEffect);
    }

    return {
      ...store,
      getState,
      dispatch,
      replaceReducer
    };
  };
}
