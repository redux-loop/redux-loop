import {
  Cmd,
  combineReducers,
  loop,
  Loop,
  LiftedLoopReducer,
  liftState,
  LoopReducer
} from '../../index';

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
  state: TodoState,
  action: TodoActions
): TodoState | Loop<TodoState, TodoActions> => {
  switch (action.type) {
    case 'ADD_TODO':
      return loop(
        { ...state, todos: [...state.todos, action.text] },
        Cmd.batch([Cmd.none, Cmd.action(noop())])
      );
    case 'NOOP':
      return state;
    case 'UPDATE_NESTED_COUNTER':
      const [model, cmd] = liftState(
        counterReducer(state.nestedCounter, action.subAction)
      );
      return loop(
        { ...state, nestedCounter: model },
        Cmd.map(cmd, updateNestedCounter)
      );
    default:
      return loop(
        state,
        Cmd.sequence([
          Cmd.none,
          Cmd.run(console.log, { args: ['log this', Cmd.getState] }),
          Cmd.run(dispatchNoop, { args: [Cmd.dispatch] })
        ])
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
  state: CounterState,
  action: CounterActions
): CounterState => {
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
