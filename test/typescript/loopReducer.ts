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
  | { type: 'SUCCESS', value: number, extraArgs: Object }
  | { type: 'FAIL', error: any, extraArgs: Object }
  | { type: 'UPDATE_NESTED_COUNTER'; subAction: CounterActions };

const noop = (): TodoActions => ({
  type: 'NOOP'
});

type SuccessExtraArgs = {
  n: number
}

type FailExtraArgs = {
  m: string
}

const success = (result: number): TodoActions => ({
  type: 'SUCCESS',
  value: result,
  extraArgs: {
    n: 1
  }
})

const successWithExtra = (result: number, extraArgs: SuccessExtraArgs): TodoActions => ({
  type: 'SUCCESS',
  value: result,
  extraArgs
})

const fail = (error: any, extraArgs: FailExtraArgs): TodoActions => ({
  type: 'FAIL',
  error,
  extraArgs
})

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
        Cmd.map(cmd, updateNestedCounter)
      );
    default:
      return loop(
        state,
        Cmd.list([
          Cmd.none,
          Cmd.run(console.log, { args: ['log this', Cmd.getState] }),
          Cmd.run(dispatchNoop, { args: [Cmd.dispatch] }),
          Cmd.run(() => 123, {
            // successActionCreator: success,
            successActionCreator: [success, {n: 1}], // <-- this is ok because javascript allows extra args to be ignored
          }),
          Cmd.run(() => 123, {
            successActionCreator: [successWithExtra, {n: 1}],
            // successActionCreator: successWithExtra, // <-- this fails beacuse `success` takes 1 extra arg
            // successActionCreator: [successWithExtra, {m: "different"}], // <-- this fails because `success` take a different type of extra arg
          }),
          Cmd.run(() => 123, {
            failActionCreator: [fail, {m: "error"}],
            // failActionCreator: [fail, {n: 1}], // <-- this fails because `fail` takes a different type of extra arg
            // failActionCreator: fail, // <-- this fails because `fail` requires 1 extra arg

          })
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
