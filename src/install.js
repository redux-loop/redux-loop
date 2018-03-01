import { liftState } from './loop'
import { executeCmd } from './cmd'
import { loopPromiseCaughtError } from './errors'

export function install() {
  return (next) => (reducer, initialState, enhancer) => {
    const [initialModel, initialCmd] = liftState(initialState)
    let cmdsQueue = []

    const liftReducer = (reducer) => (state, action) => {
      const result = reducer(state, action)
      const [model, cmd] = liftState(result)
      cmdsQueue.push({ originalAction: action, cmd })
      return model
    }

    const store = next(liftReducer(reducer), initialModel, enhancer)

    const runCmds = (queue) => {
      const promises = queue.map(runCmd).filter((x) => x)
      if (promises.length === 0) {
        return Promise.resolve()
      } else if (promises.length === 1) {
        return promises[0]
      } else {
        return Promise.all(promises).then(() => {})
      }
    }

    const runCmd = ({ originalAction, cmd }) => {
      const cmdPromise = executeCmd(cmd, dispatch, store.getState)

      if (!cmdPromise) return null

      return cmdPromise
        .then((actions) => {
          if (!actions.length) return
          return Promise.all(actions.map(dispatch))
        })
        .catch((error) => {
          console.error(loopPromiseCaughtError(originalAction.type, error))
          throw error
        })
    }

    const dispatch = (action) => {
      store.dispatch(action)
      const cmdsToRun = cmdsQueue
      cmdsQueue = []
      return runCmds(cmdsToRun)
    }

    const replaceReducer = (reducer) => {
      store.replaceReducer(liftReducer(reducer))
      cmdsQueue = []
    }

    runCmd({
      originalAction: { type: '@@ReduxLoop/INIT' },
      cmd: initialCmd
    })

    return {
      ...store,
      dispatch,
      replaceReducer,
    }
  }
}
