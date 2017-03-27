import * as React from 'react';
import { connect } from 'react-redux';
import { Loop } from '../modules/';
import * as Counter from './Counter';
import * as Random from './Random';

// ===== STATE ===== //

export interface State {
  counter: Counter.State;
  random: Random.State;
}

export const initialStateAndEffects: Loop<State, Action> = {
  state: {
    counter: Counter.initialState,
    random: Random.initialStateAndEffects.state,
  },
  effects: [
    ...Random.initialStateAndEffects.effects.map(
      eff => eff.map(
        nestedAction => ({ type: 'RandomAction', nestedAction }) as Action
      )
    ),
  ],
};

// ===== REDUCER ===== //

export type Action = CounterAction | RandomAction;
export type CounterAction = { type: 'CounterAction', nestedAction: Counter.Action };
export type RandomAction = { type: 'RandomAction', nestedAction: Random.Action };

export function reducer(state: State, action: Action): Loop<State, Action> {
  switch (action.type) {
    case 'CounterAction':
      return {
        state: {
          ...state,
          counter: Counter.reducer(state.counter, action.nestedAction)
        },
        effects: [],
      };

    case 'RandomAction': {
      const { state: nextState, effects } = Random.reducer(state.random, action.nestedAction);
      return {
        state: {
          ...state,
          random: nextState,
        },
        effects: [
          ...effects.map(
            eff => eff.map(
              nestedAction => ({ type: 'RandomAction', nestedAction }) as Action
            )
          ),
        ],
      };
    }

    default:
      return { state, effects: [] };
  }
}

// ===== VIEW ===== //

export interface AppProps {
  state: State;
  dispatch: (action: Action) => void;
}

function AppComponent({ state, dispatch }: AppProps) {
  return (
    <div>
      <Counter.Counter
        state={state.counter}
        dispatch={nestedAction => dispatch({ type: 'CounterAction', nestedAction })}
      />
      <Random.Random
        state={state.random}
        dispatch={nestedAction => dispatch({ type: 'RandomAction', nestedAction })}
      />
    </div>
  );
}

export const App = connect((state) => ({ state }))(AppComponent)
