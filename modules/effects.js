import Cmd, { isCmd } from './cmd';
import { throwInvariant } from './utils';

const promise = (
  promiseFactory,
  ...args
) => {
  console.warn(`Effects.promise is deprecated. Please
    use Cmd.run (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#cmdrunfunc-options).
    Effects.promise will be removed in the next major version.`)
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof promiseFactory === 'function',
      'Effects.promise: first argument to Effects.promise must be a function that returns a promise'
    )
  }

  return Cmd.run(promiseFactory, {
    successActionCreator: action => action,
    failActionCreator: action => action,
    args
  })
}


const call = (
  resultFactory,
  ...args
) => {
  console.warn(`Effects.call is deprecated. Please
    use Cmd.run (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#cmdrunfunc-options).
    Effects.call will be removed in the next major version.`)
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof resultFactory === 'function',
      'Effects.call: first argument to Effects.call must be a function'
    )
  }

  return Cmd.run(resultFactory, {
    successActionCreator: action => action,
    args
  })
}

const constant = (actionToDispatch) => {
  console.warn(`Effects.constant is deprecated and has been renamed Cmd.action. 
    Effects.constant will be removed in the next major version.`)
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      typeof actionToDispatch === 'object' && actionToDispatch !== null && typeof actionToDispatch.type !== 'undefined',
      'Effects.constant: first argument and only argument to Cmd.constant must be an action'
    )
  }
  return Cmd.action(actionToDispatch)
}

const batch = (cmds) => {
  console.warn(`Effects.batch is deprecated and has been renamed Cmd.batch. 
    Effects.batch will be removed in the next major version.`)
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      Array.isArray(cmds) && cmds.every(isCmd),
      'Effects.batch: first and only argument to Effects.batch must be an array of other Cmds/Effects'
    )
  }

  return Cmd.batch(cmds)
}

const lift = (
  nestedCmd,
  tagger,
  args
) => {
  console.warn(`Effects.lift is deprecated and has been renamed Cmd.map. 
    Effects.lift will be removed in the next major version.`)
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      isCmd(nestedCmd),
      'Effects.lift: first argument to Effects.lift must be another Cmd'
    )

    throwInvariant(
      typeof tagger === 'function',
      'Effects.lift: second argument to Effects.lift must be a function that returns an action'
    )
  }

  return Cmd.map(nestedCmd, tagger, ...args)
}
 

const none = {...Cmd.none, isEffect: true}

export default {
  promise,
  call,
  constant,
  batch,
  lift,
  none
}