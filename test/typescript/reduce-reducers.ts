/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  combineReducers,
  reduceReducers,
  Loop,
  LoopReducer,
  LoopReducerWithDefinedState,
  getModel,
  getCmd,
  CmdType
} from '../../index';
import { Action } from 'redux';

type ReducedState = {
  add: number;
  mult: number;
};

const initialState: ReducedState = {
  add: 0,
  mult: 2
};

type AddAction = Action<'add'> & {
  value: number;
};

type MultiplyAction = Action<'multiply'> & {
  value: number;
};

const addReducer: LoopReducer<ReducedState, AddAction> = (
  state = initialState,
  action
) => {
  if (action.type === 'add') {
    return { ...state, add: state.add + action.value };
  }
  return state;
};

const multReducer: LoopReducerWithDefinedState<ReducedState, MultiplyAction> = (
  state,
  action
) => {
  if (action.type === 'multiply') {
    return { ...state, mult: state.mult * action.value };
  }
  return state;
};

const add = (value: number): AddAction => ({
  type: 'add',
  value
});

const multiply = (value: number): MultiplyAction => ({
  type: 'multiply',
  value
});

const reducer = reduceReducers(addReducer, multReducer);

const result1: Loop<ReducedState> = reducer(undefined, add(5));
const result2: Loop<ReducedState> = reducer(initialState, multiply(5));
const newState: ReducedState = getModel(result2);
const cmd: CmdType | null = getCmd(result2);
