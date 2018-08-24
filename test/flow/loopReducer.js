// @flow
/* eslint-disable */

import {
  Cmd,
  combineReducers,
  loop,
  liftState,
  type Loop,
  type LiftedLoopReducer,
  type LoopReducer
} from 'redux-loop';

type TodoState = { todos: Array<string>, nestedCounter: number };

type TodoActions =
  | { type: 'ADD_TODO', text: string }
  | { type: 'NOOP' }
  | { type: 'UPDATE_NESTED_COUNTER', subAction: CounterActions };

const noop = (): TodoActions => ({
  type: 'NOOP'
});

const updateNestedCounter = (subAction: CounterActions): TodoActions => ({
  type: 'UPDATE_NESTED_COUNTER',
  subAction
});

const todosReducer = (
  state: TodoState = { todos: [], nestedCounter: 0 },
  action: TodoActions
) => {
  switch (action.type) {
    case 'ADD_TODO':
      return loop(
        { ...state, todos: [...state.todos, action.text] },
        Cmd.list([Cmd.none, Cmd.action(noop())])
      );
    case 'NOOP':
      return state;
    case 'UPDATE_NESTED_COUNTER':
      const [model, cmd] = liftState(
        counterReducer(state.nestedCounter, action.subAction)
      );
      return loop(
        { ...state, nestedCounter: model },
        // Able to detect error in third param
        Cmd.map(cmd, updateNestedCounter)
      );
    default:
      return loop(
        state,
        Cmd.list([
          Cmd.none,
          Cmd.run(console.log, { args: ['log this', Cmd.getState] }),
          // Able to detect error in args
          Cmd.run(dispatchNoop, { args: [Cmd.dispatch] })
        ], {sequence: true})
      );
  }
};

(todosReducer: LoopReducer<TodoState, TodoActions>);

const dispatchNoop = (dispatch) => {
  // dispatch doesn't do type check here
  dispatch(noop());
};

type LoopOrState<S, A> = S | Loop<S, A>

const todoState = todosReducer(
  { todos: [], nestedCounter: 0 },
  {
    type: 'ADD_TODO',
    text: 'test'
  }
);

(todoState: LoopOrState<TodoState, TodoActions>);

type CounterState = number;

type CounterActions = {
  type: 'INCREMENT';
};

const counterReducer: LoopReducer<CounterState, CounterActions> = (
  state: CounterState = 0,
  action: CounterActions
) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    default:
      return state;
  }
};

type RootState = {
  todos: TodoState;
  counter: CounterState;
};

type RootAction = TodoActions | CounterActions;

const rootReducer = combineReducers({
  todos: todosReducer,
  counter: counterReducer
});

(rootReducer: LiftedLoopReducer<RootState, RootAction>);

const rootState: RootState = rootReducer(undefined, {
  type: 'ADD_TODO',
  text: 'test'
})[0];

const successActionCreator = (a: number) => ({type: 'FOO', a: 2 * a});

// Able to detect errors in return value of the function
// Able to detect errors in param value of successActionCreator
let cmd = Cmd.run(() => Promise.resolve(1), {
  successActionCreator
});

// Able to detect errors in result
let action = cmd.simulate({success: true, result: 123});

// Not able to detect error in result
let listCmd = Cmd.list([cmd, cmd]);
let actions = listCmd.simulate([{success: true, result: 123}, {success: false, result: 456}]);
let nestedListCmd = Cmd.list([cmd, listCmd]);
let flattenedActions = nestedListCmd.simulate([
  {success: true, result: 123},
  [
    {success: true, result: 456},
    {success: true, result: 789},
  ]
]);
