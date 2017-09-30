import { throwInvariant, flatten, isPromiseLike } from './utils';

const isCmdSymbol = Symbol('isCmd');
const dispatchSymbol = Symbol('dispatch');
const getStateSymbol = Symbol('getState');

const cmdTypes = {
  RUN: 'RUN',
  ACTION: 'ACTION',
  LIST: 'LIST',
  MAP: 'MAP',
  NONE: 'NONE'
}

export const isCmd = (object) => {
  return object ? !!object[isCmdSymbol] : false
}

function getMappedCmdArgs(args = [], dispatch, getState){
  return args.map(arg => {
    if (arg === dispatchSymbol) return dispatch
    else if (arg === getStateSymbol) return getState
    else return arg
  })
}

function handleRunCmd(cmd, dispatch, getState){
  // let onSuccess = cmd.successActionCreator || (() => {}),
  //     onFail = cmd.failActionCreator || (() => {})

  let onSuccess = cmd.successActionCreator
    ? cmd.successActionCreator instanceof Array
      ? (result) => cmd.successActionCreator[0](result, cmd.successActionCreator[1])
      : cmd.successActionCreator
    : (() => {})

  let onFail = cmd.failActionCreator
    ? cmd.failActionCreator instanceof Array
      ? (error) => cmd.failActionCreator[0](error, cmd.failActionCreator[1])
      : cmd.failActionCreator
    : (() => {})

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

function handleParallelList({cmds, batch = false}, dispatch, getState){
  const promises = cmds.map(nestedCmd => {
    const possiblePromise = executeCmd(nestedCmd, dispatch, getState);
    if(!possiblePromise || batch){
      return possiblePromise;
    }

    return possiblePromise.then(result => {
      return Promise.all(result.map(a => dispatch(a)));
    });
  }).filter(x => x);

  if (promises.length === 0){
    return null;
  }

  return Promise.all(promises).then(flatten).then(actions => {
    return batch ? actions : [];
  });
}

function handleSequenceList({cmds, batch = false}, dispatch, getState){
  const firstCmd = cmds.length ? cmds[0] : null;
  if(!firstCmd){
    return null;
  }

  const result = new Promise(resolve => {
    let firstPromise = executeCmd(firstCmd, dispatch, getState);
    firstPromise = firstPromise || Promise.resolve([]);
    firstPromise.then(result => {
      let executePromise;
      if(!batch){
        executePromise = Promise.all(result.map(a => dispatch(a)));
      }
      else{
        executePromise = Promise.resolve();
      }
      executePromise.then(() => {
        const remainingSequence = list(cmds.slice(1), {batch, sequence: true});
        const remainingPromise = executeCmd(remainingSequence, dispatch, getState);
        if (remainingPromise) {
          remainingPromise.then(innerResult => {
            resolve(result.concat(innerResult));
          });
        }
        else{
          resolve(result);
        }
      });
    })
  }).then(flatten);

  return batch ? result : result.then(() => []);
}

export const executeCmd = (cmd, dispatch, getState) => {
  switch (cmd.type) {
    case cmdTypes.RUN:
      return handleRunCmd(cmd, dispatch, getState)

    case cmdTypes.ACTION:
      return Promise.resolve([cmd.actionToDispatch])

    case cmdTypes.LIST:
      return cmd.sequence ? handleSequenceList(cmd, dispatch, getState) : handleParallelList(cmd, dispatch, getState);

    case cmdTypes.MAP:
      const possiblePromise = executeCmd(cmd.nestedCmd, dispatch, getState)
      if (!possiblePromise) return null
      return possiblePromise.then((actions) =>
        actions.map(action => cmd.tagger(...cmd.args, action))
      );

    case cmdTypes.NONE:
      return null

    default:
      throw new Error(`Invalid Cmd type ${cmd.type}`);
  }
}

const run = (func, options = {}) => {
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
      !options.successActionCreator || typeof options.successActionCreator === 'function' || (options.successActionCreator instanceof Array && options.successActionCreator.length === 2 && typeof options.successActionCreator[0] === 'function'),
      'Cmd.run: successActionCreator option must be a function or a 2 element array with first being a function, second being an extra argument to be applied if specified'
    )

    throwInvariant(
      !options.failActionCreator || typeof options.failActionCreator === 'function' || (options.failActionCreator instanceof Array && options.failActionCreator.length === 2 && typeof options.failActionCreator[0] === 'function'),
      'Cmd.run: failActionCreator option must be a function or a 2 element array with first being a function, second being an extra argument to be applied if specified'
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

const list = (cmds, options = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      Array.isArray(cmds) && cmds.every(isCmd),
      'Cmd.list: first argument to Cmd.list must be an array of other Cmds'
    )

    throwInvariant(
      typeof options === 'object',
      'Cmd.list: second argument to Cmd.list must be an options object'
    )
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.LIST,
    cmds,
    ...options
  });
}

const batch = (cmds) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      Array.isArray(cmds) && cmds.every(isCmd),
      'Cmd.batch: first and only argument to Cmd.batch must be an array of other Cmds'
    )
  }

  console.warn('Cmd.batch is deprecated and will be removed in version 5. Please use Cmd.list (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#cmdlistcmds-options)')
  return list(cmds, {batch: true, sequence: false});
}

const sequence = (cmds) => {
  if (process.env.NODE_ENV !== 'production') {
    throwInvariant(
      Array.isArray(cmds) && cmds.every(isCmd),
      'Cmd.sequence: first and only argument to Cmd.sequence must be an array of other Cmds'
    );
  }

  console.warn('Cmd.sequence is deprecated and will be removed in version 5. Please use Cmd.list (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#cmdlistcmds-options)')
  return list(cmds, {batch: true, sequence: true});
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
    );

    throwInvariant(
      typeof tagger === 'function',
      'Cmd.map: second argument to Cmd.map must be a function that returns an action'
    );
  }

  return Object.freeze({
    [isCmdSymbol]: true,
    type: cmdTypes.MAP,
    tagger,
    nestedCmd,
    args
  });
}

const none = Object.freeze({
  [isCmdSymbol]: true,
  type: cmdTypes.NONE,
});

export default {
  run,
  action,
  list,
  batch,
  sequence,
  map,
  none,
  dispatch: dispatchSymbol,
  getState: getStateSymbol
};