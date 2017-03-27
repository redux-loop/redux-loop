import * as React from 'react';
import { effect, Loop } from '../modules/';
import * as Utils from './Utils';

// ===== ACTIONS ===== //

export type Action = NewNumber | TimePassed;
export type NewNumber = { type: 'NewNumber', value: number };
export type TimePassed = { type: 'TimePassed' };


// ===== EFFECTS ==== //

function generateNewNumber(): Promise<Action> {
  return new Promise(resolve => {
    resolve({ type: 'NewNumber', value: Math.random() });
  });
}

function scheduleNewJob(wait: number): Promise<Action> {
  return new Promise(resolve => {
    setTimeout(() => resolve({ type: 'TimePassed' }), wait);
  });
}

// ===== STATE ===== //

export type State = number;

export const initialStateAndEffects: Loop<State, Action> = {
  state: 0,
  effects: [
    effect(scheduleNewJob, 1000)
  ]
};

// ===== REDUCDER ===== //

export function reducer(state: State, action: Action): Loop<State, Action> {
  switch (action.type) {
    case 'NewNumber':
      return {
        state: action.value,
        effects: [
          effect(scheduleNewJob, action.value * 3000)
        ]
      };

    case 'TimePassed':
      return {
        state,
        effects: [
          effect(generateNewNumber)
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
