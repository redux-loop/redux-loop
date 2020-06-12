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

type ChangeAction = Action<'change'> & {
  value: number;
};

type StuffAction = Action<'stuff'> & {
  value: string;
};

type ReducedActions = ChangeAction | StuffAction;

const addReducer: LoopReducer<ReducedState, ReducedActions> = (
  state = initialState,
  action
) => {
  if (action.type === 'change') {
    return { ...state, add: state.add + action.value };
  }
  return state;
};

const multReducer: LoopReducerWithDefinedState<ReducedState, ReducedActions> = (
  state,
  action
) => {
  if (action.type === 'change') {
    return { ...state, mult: state.mult * action.value };
  }
  return state;
};

const change = (value: number): ChangeAction => ({
  type: 'change',
  value
});

const reducer = reduceReducers(addReducer, multReducer);

const result: Loop<ReducedState> = reducer(undefined, change(5));
const newState: ReducedState = getModel(result);
const cmd: CmdType | null = getCmd(result);
