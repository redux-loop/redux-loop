import { throwInvariant, flatten, promisify, isPromiseLike } from './utils';


const isCmdSymbol = Symbol('isCmd');


const cmdTypes = {
  PROMISE: 'PROMISE',
  CALL: 'CALL',
  CALLBACK: 'CALLBACK',
  CONSTANT: 'CONSTANT',
  ARBITRARY: 'ARBITRARY',
  BATCH: 'BATCH',
  MAP: 'MAP',
  NONE: 'NONE',
  SEQUENCE: 'SEQUENCE'
}


export const isCmd = (object) => {
  return object ? object[isCmdSymbol] : false
}


export const cmdToPromise = (cmd) => {
  switch (cmd.type) {
    case cmdTypes.PROMISE:
      return cmd.promiseFactory(...cmd.args)
        .then(cmd.successActionCreator)
        .catch(cmd.failureActionCreator)
        .then((action) => {
          return [action]
        })

    case cmdTypes.CALL:
      const result = cmd.resultFactory(...cmd.args)
      return Promise.resolve([cmd.actionCreator(result)])

    case cmdTypes.CALLBACK:
      return promisify(cmd.nodeStyleFunction)(...cmd.args)
        .then(cmd.successActionCreator)
        .catch(cmd.failureActionCreator)
        .then((action) => [action])

    case cmdTypes.CONSTANT:
      return Promise.resolve([cmd.action])

    case cmdTypes.ARBITRARY:
      const possiblyPromise = cmd.func(...cmd.args)
      if (isPromiseLike(possiblyPromise)) return possiblyPromise.then(() => [])
      else return null

    case cmdTypes.BATCH:
      const batchedPromises = cmd.cmds.map(cmdToPromise).filter((x) => x)
      if (batchedPromises.length === 0) return null
      else if (batchedPromises.length === 1) return batchedPromises[0]
      else return Promise.all(batchedPromises).then(flatten)

    case cmdTypes.SEQUENCE:
      const firstCmd = cmd.cmds.length ? cmd.cmds[0] : null
      if (firstCmd) {
        return new Promise(resolve => {
          let firstPromise = cmdToPromise(firstCmd)
          if (!firstPromise) firstPromise = Promise.resolve([])
          firstPromise.then(result => {
            const remaining = cmdToPromise(sequence(cmd.cmds.slice(1)))
            if (remaining) {
              remaining.then(innerResult => {
                resolve(result.concat(innerResult))
              })
            }
            else resolve(result)
          })
        }).then(flatten)
      }
      else return null

    case cmdTypes.MAP:
      const possiblePromise = cmdToPromise(cmd.nestedCmd)
      if (!possiblePromise) return null
      return possiblePromise.then((actions) => actions.map(cmd.tagger))

    case cmdTypes.NONE:
      return null
  }
}


const promise = (
  promiseFactory,
  successActionCreator,
  failureActionCreator,
  ...args
) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof promiseFactory === 'function',
      'Cmd.promise: first argument to Cmd.promise must be a function that returns a promise'
    )

    throwInvariant(
      typeof successActionCreator === 'function',
      'Cmd.promise: second argument to Cmd.promise must be a function that returns an action'
    )

    throwInvariant(
      typeof failureActionCreator === 'function',
      'Cmd.promise: third argument to Cmd.promise must be a function that returns an action'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.PROMISE,
    promiseFactory,
    successActionCreator,
    failureActionCreator,
    args
  })
}


const call = (
  resultFactory,
  actionCreator,
  ...args
) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof resultFactory === 'function',
      'Cmd.call: first argument to Cmd.call must be a function'
    )

    throwInvariant(
      typeof actionCreator === 'function',
      'Cmd.call: second argument to Cmd.call must be a function that returns an action'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.CALL,
    resultFactory,
    actionCreator,
    args
  })
}


const callback = (
  nodeStyleFunction,
  successActionCreator,
  failureActionCreator,
  ...args
) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof nodeStyleFunction === 'function',
      'Cmd.callback: first argument to Cmd.callback must be a function that accepts a callback'
    )

    throwInvariant(
      typeof successActionCreator === 'function',
      'Cmd.callback: second argument to Cmd.callback must be a function that returns an action'
    )

    throwInvariant(
      typeof failureActionCreator === 'function',
      'Cmd.callback: third argument to Cmd.callback must be a function that returns an action'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.CALLBACK,
    nodeStyleFunction,
    successActionCreator,
    failureActionCreator,
    args,
  })
}


const constant = (action) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof action === 'object' && action !== null && typeof action.type !== 'undefined',
      'Cmd.constant: first argument and only argument to Cmd.constant must be an action'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.CONSTANT,
    action,
  })
}


const arbitrary = (func, ...args) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof func === 'function',
      'Cmd.arbitrary: first argument to Cmd.promise must be a function that returns a promise'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.ARBITRARY,
    func,
    args,
  })
}

const batch = (cmds) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      Array.isArray(cmds) && cmds.every(isCmd),
      'Cmd.batch: first and only argument to Cmd.batch must be an array of other Cmds'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.BATCH,
    cmds,
  })
}

const sequence = (cmds) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      Array.isArray(cmds) && cmds.every(isCmd),
      'Cmd.sequence: first and only argument to Cmd.sequence must be an array of other Cmds'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.SEQUENCE,
    cmds,
  })
}

const map = (
  nestedCmd,
  tagger
) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      isCmd(nestedCmd),
      'Cmd.map: first argument to Cmd.map must be a function that returns a promise'
    )

    throwInvariant(
      typeof tagger === 'function',
      'Cmd.map: second argument to Cmd.map must be a function that returns an action'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.MAP,
    tagger,
    nestedCmd,
  })
}


const none = Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.NONE,
})

export default {
  promise,
  call,
  callback,
  constant,
  arbitrary,
  batch,
  sequence,
  map,
  none
}
