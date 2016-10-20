const test = require('tape')
const { install, Task, Port, Cmd } = require('../modules')
const { execute } = require('../modules/Cmd')
const { createStore, applyMiddleware, compose } = require('redux')

const createActionCreator = (type) => (payload) => {
  return { type, payload }
}

test('Task.fail and Task.succeed with Task.perform', (t) => {
  t.plan(5)

  const createTask = (fail) => {
    return fail ?
      Task.fail('failure message') :
      Task.succeed('success message')
  }

  const startAction = createActionCreator('START')
  const failureAction = createActionCreator('FAILED')
  const successAction = createActionCreator('SUCCEEDED')

  const reducer = (model, action) => {
    switch(action.type) {
      case 'START':
        return [
          { ...model, taskMessage: 'loading' },
          createTask(action.payload).perform(successAction, failureAction)
        ]

      case 'SUCCEEDED':
      case 'FAILED':
        return [
          { ...model, taskMessage: action.payload },
          Cmd.none()
        ]

      default:
        return [model, Cmd.none()]
    }
  }

  const store = createStore(reducer, { taskMessage: 'waiting' }, install())

  t.equal(store.getState().taskMessage, 'waiting')

  store
    .dispatch(startAction(false))
    .then(() => {
      t.equal(store.getState().taskMessage, 'success message')

      const promise = store.dispatch(startAction(true))
      t.equal(store.getState().taskMessage, 'loading')
      return promise
    })
    .then(() => {
      t.equal(store.getState().taskMessage, 'failure message')
    })

  t.equal(store.getState().taskMessage, 'loading')
})

test('Port.send', (t) => {
  t.plan(2)

  let outerVariable = 1

  const increment = Port((howMuch) => {
    outerVariable += howMuch
  })

  const incrementAction = createActionCreator('INCREMENT_OUTER')

  const reducer = (model, action) => {
    switch (action.type) {
      case 'INCREMENT_OUTER':
        return [
          model,
          increment.send(action.payload)
        ]

      default:
        return [model, Cmd.none()]
    }
  }

  const store = createStore(reducer, 'test', install())


  store.dispatch(incrementAction(5))
    .then(() => {
      t.equal(outerVariable, 6)
    })

  t.equal(outerVariable, 1)
})

test('Cmd.map and Cmd.batch with Task.perform', (t) => {
  t.plan(4)

  const xTask = (howMuch) => Task.succeed(howMuch)
  const yTask = (howMuch) => Task.succeed(howMuch)

  const startAction = createActionCreator('START')
  const xAction = createActionCreator('X')
  const yAction = createActionCreator('Y')

  const nestedReducer = (model, action) => {
    switch (action.type) {
      case 'START':
        return [
          { ...model, x: 0, y: 0 },
          Cmd.batch([
            xTask(5).perform(xAction),
            yTask(4).perform(yAction),
          ])
        ]

      case 'X':
        return [
          { ...model, x: action.payload },
          Cmd.none()
        ]

      case 'Y':
        return [
          { ...model, y: action.payload },
          Cmd.none()
        ]

      default:
        return [model, Cmd.none()]
    }
  }

  const nestedAction = createActionCreator('NESTED_ACTION')

  const outerReducer = (model, action) => {
    switch(action.type) {
      case 'NESTED_ACTION':
        const [nestedModel, nestedCmd] = nestedReducer(model.nestedModel, action.payload)
        return [
          { ...model, nestedModel },
          Cmd.map(nestedAction, nestedCmd)
        ]

      default:
        return [ model, Cmd.none() ]
    }
  }

  const store = createStore(outerReducer, { nestedModel: { x: 1, y: 1 } }, install())

  store.dispatch(nestedAction(startAction()))
    .then(() => {
      t.equal(store.getState().nestedModel.x, 5)
      t.equal(store.getState().nestedModel.y, 4)
    })

  t.equal(store.getState().nestedModel.x, 0)
  t.equal(store.getState().nestedModel.y, 0)
})


test('Task.map, Task.chain, Task.mapError, Task.chainError', (t) => {
  t.plan(1)

  const methods = (value) => {
    return Task.succeed(value)
      .map((x) => x * 2)
      .chain((x) => Task.fail(x * 2))
      .mapError((x) => x * 2)
      .chainError((x) => Task.succeed(x * 2))
  }

  const action = createActionCreator('DONE')

  execute(methods(1).perform(action))
    .then((xs) => xs[0].payload)
    .then((x) => {
      t.equal(x, 16)
    })
})
