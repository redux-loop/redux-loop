import {
  Cmd,
  combineReducers,
  loop,
  Loop,
  LiftedLoopReducer,
  liftState,
  LoopReducer
} from '../../index';
import { AnyAction } from 'redux';

type TodoState = { todos: string[]; nestedCounter: number };

type TodoActions =
  | {
      type: 'ADD_TODO';
      text: string;
    }
  | { type: 'NOOP' }
  | { type: 'UPDATE_NESTED_COUNTER'; subAction: CounterActions };

const noop = (): TodoActions => ({
  type: 'NOOP'
});

const updateNestedCounter = (subAction: CounterActions): TodoActions => ({
  type: 'UPDATE_NESTED_COUNTER',
  subAction
});

const todosReducer: LoopReducer<TodoState, TodoActions> = (
  state: TodoState = { todos: [], nestedCounter: 0 },
  action: AnyAction
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
        // checks third argument
        Cmd.map(cmd, updateNestedCounter)
      );
    default:
      return loop(
        state,
        Cmd.list([
          Cmd.none,
          Cmd.run(console.log, { args: ['log this', Cmd.getState] }),
          // checks types of args
          Cmd.run(dispatchNoop, { args: [Cmd.dispatch] })
        ], {sequence: true})
      );
  }
};

const dispatchNoop = (dispatch: (a: any) => void): void => {
  dispatch(noop());
};

const todoState: TodoState = <TodoState>todosReducer(
  { todos: [], nestedCounter: 0 },
  {
    type: 'ADD_TODO',
    text: 'test'
  }
);

type CounterState = number;

type CounterActions = {
  type: 'INCREMENT';
};

const counterReducer: LoopReducer<CounterState, CounterActions> = (
  state: CounterState = 0,
  action: AnyAction
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

const rootReducer = combineReducers<RootState, RootAction>({
  todos: todosReducer,
  counter: counterReducer
});

const rootState: RootState = rootReducer(undefined, {
  type: 'ADD_TODO',
  text: 'test'
})[0];

// checks return value of the function
// checks param of the successActionCreator
let cmd = Cmd.run(() => 1, {
  successActionCreator: a => ({type: 'FOO', a: 2*a})
});
// checks result
let action: AnyAction = cmd.simulate({success: true, result: 123});
let listCmd = Cmd.list([cmd, cmd]);
let actions: AnyAction[] = listCmd.simulate([{success: true, result: 123}, {success: false, result: 456}]);
let nestedListCmd = Cmd.list([cmd, listCmd]);
let flattenedActions: AnyAction[] = nestedListCmd.simulate([
  {success: true, result: 123},
  [
    {success: true, result: 456},
    {success: true, result: 789},
  ]
]);