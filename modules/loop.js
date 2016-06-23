import { throwInvariant } from './utils';
import Cmd, { isCmd } from './cmd';


export const isLoop = (array) => {
  return Array.isArray(array) && array.length === 2 && isEffect(array[1])
};


export const getCmd = (loop) => {
  return isLoop(loop) ? loop[1] : null
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

  return [model, effect]
}


export const liftState = (state) => {
  return isLoop(state) ? state : loop(state, Cmd.none)
}
