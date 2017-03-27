import * as React from 'react';
import * as Utils from './Utils';

// ===== State ===== //

export type State = number;

export const initialState: State = 0;

// ===== REDUCER ===== //

export type Action
  = { type: 'Increment' }
  | { type: 'Decrement' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'Increment':
      return state + 1;
    case 'Decrement':
      return state - 1;
    default:
      return Utils.makeSwitchExaustive(action);
  }
}

// ===== COMPONENT ===== //

export interface Props {
  state: State;
  dispatch: (action: Action) => void;
}

export function Counter({ state, dispatch }: Props) {
  return (
    <div>
      <button onClick={() => dispatch({ type: 'Increment' })}>+</button>
      <span>{state}</span>
      <button onClick={() => dispatch({ type: 'Decrement' })}>-</button>
    </div>
  );
}
