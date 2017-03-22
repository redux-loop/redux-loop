import { throwInvariant, flatten, promisify, isPromiseLike } from './utils';


const isCmdSymbol = Symbol('isCmd');
const dispatchSymbol = Symbol('dispatch');
const getStateSymbol = Symbol('getState');


const cmdTypes = {
  PROMISE: 'PROMISE',
  CALL: 'CALL',
  CALLBACK: 'CALLBACK',
  CONSTANT: 'CONSTANT',
  ARBITRARY: 'ARBITRARY',
  BATCH: 'BATCH',
  MAP: 'MAP',
  NONE: 'NONE',
}


export const isCmd = (object) => {
  return object ? object[isCmdSymbol] : false
}

function getMappedCmdArgs(args, dispatch, getState){
  return args.map(arg => {
    if (arg === dispatchSymbol) return dispatch
    else if (arg === getStateSymbol) return getState
    else return arg
  })
}

export const cmdToPromise = (cmd, dispatch, getState) => {
  switch (cmd.type) {
    case cmdTypes.PROMISE:
      return cmd.promiseFactory(...getMappedCmdArgs(cmd.args, dispatch, getState))
        .then(cmd.successActionCreator)
        .catch(cmd.failureActionCreator)
        .then((action) => {
          return [action]
        })

    case cmdTypes.CALL:
      const result = cmd.resultFactory(...getMappedCmdArgs(cmd.args, dispatch, getState))
      return Promise.resolve([cmd.actionCreator(result)])

    case cmdTypes.CALLBACK:
      return promisify(cmd.nodeStyleFunction)(...getMappedCmdArgs(cmd.args, dispatch, getState))
        .then(cmd.successActionCreator)
        .catch(cmd.failureActionCreator)
        .then((action) => [action])

    case cmdTypes.CONSTANT:
      return Promise.resolve([cmd.action])

    case cmdTypes.ARBITRARY:
      const possiblyPromise = cmd.func(...getMappedCmdArgs(cmd.args, dispatch, getState))
      if (isPromiseLike(possiblyPromise)) return possiblyPromise.then(() => [])
      else return null

    case cmdTypes.BATCH:
      const batchedPromises = cmd.cmds.map(cmd => cmdToPromise(cmd, dispatch, getState)).filter((x) => x)
      if (batchedPromises.length === 0) return null
      else if (batchedPromises.length === 1) return batchedPromises[0]
      else return Promise.all(batchedPromises).then(flatten)

    case cmdTypes.MAP:
      const possiblePromise = cmdToPromise(cmd.nestedCmd, dispatch, getState)
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
  map,
  none,
  dispatch: dispatchSymbol,
  getState: getStateSymbol
}
