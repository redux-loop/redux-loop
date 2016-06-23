import { throwInvariant, flatten, promisify } from './utils';


const isCmdSymbol = Symbol('isCmd');


const cmdTypes = {
  PROMISE: 'PROMISE',
  CALL: 'CALL',
  CALLBACK: 'CALLBACK',
  CONSTANT: 'CONSTANT',
  BATCH: 'BATCH',
  MAP: 'MAP',
  NONE: 'NONE',
}


export const isCmd = (object) => {
  return object ? object[isCmdSymbol] : false
}


export const cmdToPromise = (cmd) => {
  switch (cmd.type) {
    case cmdTypes.PROMISE:
      return cmd.promiseFactory(...cmd.args)
        .then(
          cmd.successActionCreator,
          cmd.failureActionCreator
        )
        .then((action) => [action])

    case cmdTypes.CALL:
      const result = cmd.resultFactory(...cmd.args)
      return Promise.resolve([cmd.actionCreator(result)])

    case cmdTypes.CALLBACK:
      return promisify(cmd.nodeStyleFunction)(...cmd.args)
        .then(
          cmd.successActionCreator,
          cmd.failureActionCreator
        )
        .then((action) => [action])

    case cmdTypes.CONSTANT:
      return Promise.resolve(cmd.action)

    case cmdTypes.BATCH:
      const filteredCmds = cmd.cmds
        .filter((nextCmd) => nextCmd.type !== cmdTypes.NONE)

      const batchedPromises = filteredCmds.map(cmdToPromise).filter((x) => x)

      if (batchedPromises.length === 0) return null
      else if (batchedPromises.length === 1) return batchedPromises[0]
      return Promise.all(batchedPromises).then(flatten)

    case cmdTypes.MAP:
      const possiblePromise = cmdToPromise(cmd.cmd)
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
) => Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.PROMISE,
  promiseFactory,
  successActionCreator,
  failureActionCreator,
  args
})


const call = (
  resultFactory,
  actionCreator,
  ...args
) => Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.CALL,
  resultFactory,
  actionCreator,
  args
})


const callback = (
  nodeStyleFunction,
  successActionCreator,
  failureActionCreator,
  ...args
) => Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.CALLBACK,
  nodeStyleFunction,
  successActionCreator,
  failureActionCreator,
  args,
})


const constant = (action) => Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.CONSTANT,
  action,
})


const batch = (cmds) => Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.BATCH,
  cmds,
})


const map = (
  tagger,
  nestedCmd
) => Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.MAP,
  tagger,
  nestedCmd,
})


const none = Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.NONE,
})

export default {
  promise,
  call,
  callback,
  constant,
  batch,
  map,
  none,
}
