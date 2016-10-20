const { isNone, execute, batch } = require('./Cmd')

const install = () => (next) => (reducer, initialModel, enhancer) => {
  let queue = []

  const liftReducer = (reducer) => (state, action) => {
    const [model, cmd] = reducer(state, action)

    if (!isNone(cmd)) {
      queue.push(cmd)
    }

    return model
  }

  const store = next(liftReducer(reducer), initialModel, enhancer)

  const dispatch = (action) => {
    store.dispatch(action)

    if (queue.length) {
      const currentQueue = queue
      queue = []
      return execute(batch(currentQueue))
        .then((actions) => Promise.all(actions.map(dispatch)))
        .then(() => {})
    }

    return Promise.resolve()
  }

  const replaceReducer = (reducer) => {
    return store.replaceReducer(liftReducer(reducer))
  }

  return {
    ...store,
    dispatch,
    replaceReducer,
  }
}

module.exports = install;
