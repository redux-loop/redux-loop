import * as React from 'react';
import { effect, Loop, Effect } from '../modules/';
import * as Utils from './Utils';

// ===== ACTIONS ===== //

export type Action = NewNumber | OneSecondPassed;
export type NewNumber = { type: 'NewNumber', value: number };
export type OneSecondPassed = { type: 'OneSecondPassed' };


// ===== EFFECTS ==== //

const generateNewNumber: Effect<Action> = effect(
  () => new Promise(resolve => {
    resolve({ type: 'NewNumber', value: Math.random() })
  })
);

function scheduleNewJob(wait: number): Effect<Action> {
  return effect(
    () => new Promise(resolve => {
      setTimeout(() => resolve({ type: 'OneSecondPassed' }), wait)
    })
  );
}

// ===== STATE ===== //

export type State = number;

export const initialStateAndEffects: Loop<State, Action> = {
  state: 0,
  effects: [
    scheduleNewJob(1000),
  ],
};

// ===== REDUCDER ===== //

export function reducer(state: State, action: Action): Loop<State, Action> {
  switch (action.type) {
    case 'NewNumber':
      return {
        state: action.value,
        effects: [
          scheduleNewJob(action.value * 3000),
        ]
      };

    case 'OneSecondPassed':
      return {
        state,
        effects: [
          generateNewNumber,
        ]
      };

    default:
      return Utils.makeSwitchExaustive(action);
  }
}

// ===== COMPONENT ===== //

export interface RandomProps {
  state: State;
  dispatch: (action: Action) => void;
}

export function Random({ state, dispatch }: RandomProps) {
  return (
    <div>{state}</div>
  );
}
