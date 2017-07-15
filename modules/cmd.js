import { throwInvariant, flatten, isPromiseLike } from './utils';


const isCmdSymbol = Symbol('isCmd');
const dispatchSymbol = Symbol('dispatch');
const getStateSymbol = Symbol('getState');


const cmdTypes = {
  RUN: 'RUN',
  ACTION: 'ACTION',
  //CALLBACK: 'CALLBACK',
  BATCH: 'BATCH',
  MAP: 'MAP',
  NONE: 'NONE',
  SEQUENCE: 'SEQUENCE'
}

export const isCmd = (object) => {
  return object ? object[isCmdSymbol] : false
}

function getMappedCmdArgs(args = [], dispatch, getState){
  return args.map(arg => {
    if (arg === dispatchSymbol) return dispatch
    else if (arg === getStateSymbol) return getState
    else return arg
  })
}

function handleRunCmd(cmd, dispatch, getState){
  let onSuccess = cmd.successActionCreator || (() => {}),
      onFail = cmd.failActionCreator || (() => {})

  try{
    let result = cmd.func(...getMappedCmdArgs(cmd.args, dispatch, getState))

    if (isPromiseLike(result) && !cmd.forceSync){
      return result.then(onSuccess, onFail).then(action => {
        return action ? [action] : [];
      })
    }
    let resultAction = onSuccess(result);
    return resultAction ? Promise.resolve([resultAction]) : null;
  }
  catch(err){
    if(!cmd.failActionCreator){
      throw err //don't swallow errors if they are not handling them
    }
    let resultAction = onFail(err);
    return resultAction ? Promise.resolve([resultAction]) : null;
  }
}

export const cmdToPromise = (cmd, dispatch, getState) => {
  switch (cmd.type) {
    case cmdTypes.RUN:
      return handleRunCmd(cmd, dispatch, getState)

    case cmdTypes.ACTION:
      return Promise.resolve([cmd.actionToDispatch])

    case cmdTypes.BATCH:
      const batchedPromises = cmd.cmds.map(nestedCmd => cmdToPromise(nestedCmd, dispatch, getState)).filter(x => x)
      if (batchedPromises.length === 0) return null
      else if (batchedPromises.length === 1) return batchedPromises[0]
      else return Promise.all(batchedPromises).then(flatten)

    case cmdTypes.SEQUENCE:
      const firstCmd = cmd.cmds.length ? cmd.cmds[0] : null
      if (firstCmd) {
        return new Promise(resolve => {
          let firstPromise = cmdToPromise(firstCmd, dispatch, getState)
          if (!firstPromise) firstPromise = Promise.resolve([])
          firstPromise.then(result => {
            const remaining = cmdToPromise(sequence(cmd.cmds.slice(1)), dispatch, getState)
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
      const possiblePromise = cmdToPromise(cmd.nestedCmd, dispatch, getState)
      if (!possiblePromise) return null
      return possiblePromise.then((actions) => 
        actions.map(action => cmd.tagger(...cmd.args, action))
      );

    /*case cmdTypes.CALLBACK:
      return promisify(cmd.nodeStyleFunction)(...getMappedCmdArgs(cmd.args, dispatch, getState))
        .then(cmd.successActionCreator)
        .catch(cmd.failureActionCreator)
        .then((action) => [action])*/

    case cmdTypes.NONE:
      if(cmd.isEffect){
          console.warn(`Effects.none is deprecated and has been renamed Cmd.none. 
            Effects.none will be removed in the next major version.`)
      }
      return null
  }
}

const run = (
  func,
  options = {}
) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof func === 'function',
      'Cmd.run: first argument to Cmd.run must be a function'
    )

    throwInvariant(
      typeof options === 'object',
      'Cmd.run: second argument to Cmd.run must be an options object'
    )

    throwInvariant(
      !options.successActionCreator || typeof options.successActionCreator === 'function',
      'Cmd.run: successActionCreator option must be a function if specified'
    )

    throwInvariant(
      !options.failActionCreator || typeof options.failActionCreator === 'function',
      'Cmd.run: failActionCreator option must be a function if specified'
    )

    throwInvariant(
      !options.args || options.args.constructor === Array,
      'Cmd.run: args option must be an array if specified'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.RUN,
    func,
    ...options
  })
}

const promise = (
  promiseFactory,
  successActionCreator,
  failureActionCreator,
  ...args
) => {
  console.warn('Cmd.promise is deprecated. Please use Cmd.run (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#cmdrunfunc-options)')
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

  return run(promiseFactory, {
    successActionCreator,
    failActionCreator: failureActionCreator,
    args
  })
}


const call = (
  resultFactory,
  actionCreator,
  ...args
) => {
  console.warn('Cmd.call is deprecated. Please use Cmd.run (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#cmdrunfunc-options)')
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

  return run(resultFactory, {
    successActionCreator: actionCreator,
    args
  })
}

const action = (actionToDispatch) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof actionToDispatch === 'object' && actionToDispatch !== null && typeof actionToDispatch.type !== 'undefined',
      'Cmd.action: first argument and only argument to Cmd.action must be an action'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.ACTION,
    actionToDispatch
  })
}

const constant = (actionToDispatch) => {
  console.warn('Cmd.constant has been renamed Cmd.action.')
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof actionToDispatch === 'object' && actionToDispatch !== null && typeof actionToDispatch.type !== 'undefined',
      'Cmd.constant: first argument and only argument to Cmd.constant must be an action'
    )
  }
  return action(actionToDispatch)
}


const arbitrary = (func, ...args) => {
  console.warn('Cmd.arbitrary is deprecated. Please use Cmd.run (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#cmdrunfunc-options)')
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof func === 'function',
      'Cmd.arbitrary: first argument to Cmd.arbitrary must be a function'
    )
  }

  return run(func, {args})
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
  tagger,
  ...args
) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      isCmd(nestedCmd),
      'Cmd.map: first argument to Cmd.map must be another Cmd'
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
    args
  })
}

/*
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
*/


const none = Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.NONE,
})

export default {
  run,
  action,
  promise,
  call,
  //callback,
  constant,
  arbitrary,
  batch,
  sequence,
  map,
  none,
  dispatch: dispatchSymbol,
  getState: getStateSymbol
}
