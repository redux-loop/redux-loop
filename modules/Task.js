const { custom } = require('./Cmd')

const isTaskSymbol = Symbol()

const createTask = (attrs) => {
  const result = Object.create(TaskProto)
  for (var k in attrs) {
    result[k] = attrs[k]
  }
  return Object.freeze(result)
}

const TaskProto = Object.freeze({
  [isTaskSymbol]: true,

  map(tagger) {
    return createTask({
      type: 'map',
      child: this,
      tagger,
    })
  },

  mapError(tagger) {
    return createTask({
      type: 'mapError',
      child: this,
      tagger,
    })
  },

  chain(callback) {
    return createTask({
      type: 'chain',
      child: this,
      callback,
    })
  },

  chainError(callback) {
    return createTask({
      type: 'chainError',
      child: this,
      callback,
    })
  },

  perform(onFinished) {
    return custom('Task.perform', performTask, [onFinished, this])
  },

  attempt(onError, onSuccess) {
    return custom('Task.attempt', attemptTask, [onError, onSuccess, this])
  }
})

const performTask = (onFinished, task) => {
  return executeTask(task).then(onFinished)
}

const attemptTask = (onError, onSuccess, task) => {
  return executeTask(task).then(onSuccess, onError)
}

const Task = (callback) => {
  return createTask({
    type: 'leaf',
    callback,
  })
}

Task.succeed = (value) => {
  return createTask({
    type: 'succeed',
    value,
  })
}

Task.fail = (error) => {
  return createTask({
    type: 'fail',
    error,
  })
}

Task.fromPromise = (factory, ...args) => {
  return createTask({
    type: 'promise',
    factory,
    args,
  })
}

Task.fromCallback = (callback, ...args) => {
  return createTask({
    type: 'callback',
    callback,
    args,
  })
}

Task.isTask = (task) => {
  return task[isTaskSymbol] === true
}

const executeTask = (task) => {
  switch(task.type) {
    case 'leaf':
      return new Promise(task.callback)

    case 'succeed':
      return Promise.resolve(task.value)

    case 'fail':
      return Promise.reject(task.error)

    case 'promise':
      return task.factory(...task.args)

    case 'callback':
      return new Promise((resolve, reject) => {
        const cb = (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }

        task.callback.apply(null, task.args.concat(cb))
      })

    case 'map':
      return executeTask(task.child)
        .then(task.tagger)

    case 'mapError':
      return executeTask(task.child)
        .then(null, (a) => Promise.reject(task.tagger(a)))

    case 'chain':
      return executeTask(task.child)
        .then((result) => executeTask(task.callback(result)))

    case 'chainError':
      return executeTask(task.child)
        .then(null, (error) => executeTask(task.callback(error)))
  }
}

module.exports = Task
