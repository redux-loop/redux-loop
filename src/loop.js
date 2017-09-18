import { throwInvariant } from './utils';
import Cmd, { isCmd } from './cmd';


export const isLoop = (array) => {
  return Array.isArray(array) && array.length === 2 && isCmd(array[1])
};


export const getCmd = (loop) => {
  return isLoop(loop) ? loop[1] : null
}

export const getEffect = (loop) => {
  console.warn(`getEffect is deprecated. Please
    use getCmd (https://github.com/redux-loop/redux-loop/blob/master/docs/ApiDocs.md#getcmdloop-cmd--null).
    getEffect will be removed in the next major version.`)

  return getCmd(loop)
}

export const getModel = (loop) => {
  return isLoop(loop) ? loop[0] : loop
}


export const loop = (model, cmd) => {
  if(process.env.NODE_ENV === 'development') {
    throwInvariant(
      isCmd(cmd),
      'Given cmd is not an Cmd instance.'
    )
  }

  return [model, cmd]
}


export const liftState = (state) => {
  return isLoop(state) ? state : loop(state, Cmd.none)
}
