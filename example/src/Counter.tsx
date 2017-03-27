import * as React from 'react';
import * as Utils from './Utils';

// ===== MODEL ===== //

export type Model = number;

export const init: Model = 0;

// ===== UPDATE ===== //

export type Action
  = { type: 'Increment' }
  | { type: 'Decrement' };

export function update(model: Model, action: Action): Model {
  switch (action.type) {
    case 'Increment':
      return model + 1;
    case 'Decrement':
      return model - 1;
    default:
      return Utils.makeSwitchExaustive(action);
  }
}

// ===== VIEW ===== //

export interface ViewProps {
  model: Model;
  dispatch: (action: Action) => void;
}

export function View({ model, dispatch }: ViewProps) {
  return (
    <div>
      <button onClick={() => dispatch({ type: 'Increment' })}>+</button>
      <span>{model}</span>
      <button onClick={() => dispatch({ type: 'Decrement' })}>-</button>
    </div>
  );
}