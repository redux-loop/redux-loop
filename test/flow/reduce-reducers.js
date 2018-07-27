// @flow
/* eslint-disable */

import {
  reduceReducers,
  getModel,
  getCmd,
  type Loop,
  type LoopReducer,
  type CmdType
} from 'redux-loop';

type ReducedState = { add: number, mult: number };

const initialState: ReducedState = {
  add: 0,
  mult: 2
};

type ReducedActions =
  | {
      type: 'change';
      value: number;
    };

const addReducer: LoopReducer<ReducedState, ReducedActions> = (
  state = initialState,
  action: ReducedActions
) => {
  if(action.type === 'change'){
    return {...state, add: state.add + action.value};
  }
  return state;
};

const multReducer: LoopReducer<ReducedState, ReducedActions> = (
  state = initialState,
  action: ReducedActions
) => {
  if(action.type === 'change'){
    return {...state, mult: state.mult * action.value};
  }
  return state;
};

const change = (value: number): ReducedActions => ({
  type: 'change',
  value
});

const reducer = reduceReducers(addReducer, multReducer);

const result = reducer(undefined, change(5));
(result: Loop<ReducedState, ReducedActions>)
const newState = getModel(result);
(newState: ReducedState);
const cmd = getCmd(result);
(cmd: CmdType<ReducedActions> | null);
