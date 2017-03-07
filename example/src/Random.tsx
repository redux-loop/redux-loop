import * as React from 'react';
import { Effects, Loop } from '../../modules/';
import * as Utils from './Utils';

// ===== MODEL ===== //

export type Model = number;

export const init: Loop<Model, Action> = {
  state: 0,
  effects: [
    generateNewNumber(),
    scheduleNewJob(),
  ],
};

function generateNewNumber() {
  return Effects.fromLazyPromise(
    () => new Promise((resolve => resolve(Math.random())))
      .then(n => ({ type: 'NewNumber', value: n }))
  );
}

function scheduleNewJob() {
  return Effects.fromLazyPromise(
    () => new Promise(resolve => setTimeout(resolve, 1000))
  );
}

// ===== UPDATE ===== //

export type Action = NewNumber | OneSecondPassed;
export type NewNumber = { type: 'NewNumber', value: number };
export type OneSecondPassed = { type: 'OneSecondPassed' };

export function update(model: Model, action: Action): Loop<Model, Action> {
  switch (action.type) {
    case 'NewNumber':
      return {
        state: action.value,
        effects: [
          scheduleNewJob(),
        ]
      };
    case 'OneSecondPassed':
      return {
        state: model,
        effects: [
          generateNewNumber(),
        ]
      };
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
    <div>{model}</div>
  );
}