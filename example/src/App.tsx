import * as React from 'react';
import { Loop } from '../../modules/';
import * as Counter from './Counter';
import * as Random from './Random';

// ===== MODEL ===== //

export interface Model {
  counter: Counter.Model;
  random: Random.Model;
}

export const init: Loop<Model, Action> = {
  state: {
    counter: Counter.init,
    random: Random.init.state,
  },
  effects: [
    ...Random.init.effects.map(
      eff => eff.map(
        nestedAction => ({ type: 'RandomAction', nestedAction }) as Action
      )
    ),
  ],
};

// ===== UPDATE ===== //

export type Action = CounterAction | RandomAction; 
export type CounterAction = { type: 'CounterAction', nestedAction: Counter.Action };
export type RandomAction = { type: 'RandomAction', nestedAction: Random.Action };

export function reducer(model: Model, action: Action): Loop<Model, Action> {
  switch (action.type) {
    case 'CounterAction':
      return {
        state: {
          ...model,
          counter: Counter.update(model.counter, action.nestedAction)
        },
        effects: [],
      };
    case 'RandomAction': {
      const { state: nextState, effects } = Random.update(model.random, action.nestedAction);
      return {
        state: {
          ...model,
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
      return { state: model, effects: [] };
  }
}

// ===== VIEW ===== //

interface Props {
  model: Model;
  dispatch: (action: Action) => void;
}

export function View({ model, dispatch}: Props) {
  return (
    <div>
      <Counter.View
        model={model.counter}
        dispatch={nestedAction => dispatch({ type: 'CounterAction', nestedAction })}
      />
      <Random.View
        model={model.random}
        dispatch={nestedAction => dispatch({ type: 'RandomAction', nestedAction })}
      />
    </div>
  );
}