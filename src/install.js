import { liftState } from './loop';
import { executeCmd } from './cmd';
import { loopPromiseCaughtError } from './errors';

const defaultLoopConfig = {
  DONT_LOG_ERRORS_ON_HANDLED_FAILURES: false,
  ENABLE_THUNK_MIGRATION: false
};

export function install(config = {}) {
  const loopConfig = Object.assign({}, defaultLoopConfig, config);

  return next => (reducer, initialState, enhancer) => {
    const [initialModel, initialCmd] = liftState(initialState);
    let cmdsQueue = [];

    const liftReducer = reducer => (state, action) => {
      const result = reducer(state, action);
      const [model, cmd] = liftState(result);
      cmdsQueue.push({ originalAction: action, cmd });
      return model;
    };

    const store = next(liftReducer(reducer), initialModel, enhancer);

    function runCmds(queue) {
      const promises = queue.map(runCmd).filter(x => x);
      if (promises.length === 0) {
        return Promise.resolve();
      } else if (promises.length === 1) {
        return promises[0];
      } else {
        return Promise.all(promises).then(() => {});
      }
    }

    function runCmd({ originalAction, cmd }) {
      const cmdPromise = executeCmd({
        cmd,
        dispatch,
        getState: store.getState,
        loopConfig
      });

      if (!cmdPromise) {
        return null;
      }

      return cmdPromise
        .then(actions => {
          if (!actions.length) {
            return;
          }
          return Promise.all(actions.map(dispatch));
        })
        .catch(error => {
          console.error(loopPromiseCaughtError(originalAction.type, error));
          throw error;
        });
    }

    function dispatch(action) {
      if (loopConfig.ENABLE_THUNK_MIGRATION && typeof action === 'function') {
        return action(dispatch, store.getState);
      }
      const result = store.dispatch(action);
      const cmdsToRun = cmdsQueue;
      cmdsQueue = [];
      return runCmds(cmdsToRun).then(() => result);
    }

    function replaceReducer(reducer) {
      return store.replaceReducer(liftReducer(reducer));
    }

    runCmd({
      originalAction: { type: '@@ReduxLoop/INIT' },
      cmd: initialCmd
    });

    return {
      ...store,
      dispatch,
      replaceReducer
    };
  };
}
