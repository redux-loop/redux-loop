/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Cmd,
  combineReducers,
  install,
  loop,
  liftState,
  LoopReducer,
  StoreCreator,
} from '../../index';
import { Action, AnyAction, createStore } from 'redux';

const FETCH_FOO_REQUEST = 'FETCH_FOO_REQUEST';
const FETCH_FOO_SUCCESS = 'FETCH_FOO_SUCCESS';
const FETCH_FOO_FAILURE = 'FETCH_FOO_FAILURE';
const NOOP = 'NOOP';
const UPDATE_NESTED_COUNTER = 'UPDATE_NESTED_COUNTER';
const ADD_TODO = 'ADD_TODO';

type TodoState = { todos: string[]; nestedCounter: number };

const initialTodoState: TodoState = { todos: [], nestedCounter: 0 };

type IAddTodo = Action<typeof ADD_TODO> & {
  text: string;
};

type INoopAction = Action<typeof NOOP>;

type IUpdateNestedCounter = Action<typeof UPDATE_NESTED_COUNTER> & {
  subAction: CounterActions;
};

type TodoReducerActions =
  | IAddTodo
  | INoopAction
  | IUpdateNestedCounter
  | IFetchFooRequest;

const noop = (): TodoReducerActions => ({
  type: NOOP,
});

const updateNestedCounter = (
  subAction: CounterActions
): TodoReducerActions => ({
  type: UPDATE_NESTED_COUNTER,
  subAction,
});

interface IFetchFooRequest {
  type: typeof FETCH_FOO_REQUEST;
}

interface IFetchFooSuccess {
  type: typeof FETCH_FOO_SUCCESS;
}

const fetchFooSuccess = (_result: string): IFetchFooSuccess => ({
  type: FETCH_FOO_SUCCESS,
});

interface IFetchFooFailure {
  type: typeof FETCH_FOO_FAILURE;
}

class CustomError extends Error {
  prop = 'myprop';
}

const fetchFooFailure = (_err: CustomError): IFetchFooFailure => ({
  type: FETCH_FOO_FAILURE,
});

const apiFetchFoo = () => Promise.resolve('foo');

const dispatchNoop = (dispatch: Cmd.Dispatch): void => {
  dispatch(noop());
};

const getState = (_n: number, getState: Cmd.GetState): void => {
  getState();
};

const typedArgs = (_a: number, _b: string, _c: { n: number }) => {
  // intentionally empty
};

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

function updateNestedCounterHandler(action: AnyAction, state: TodoState) {
  const [model, cmd] = liftState(
    counterReducer(state.nestedCounter, action.subAction)
  );
  return loop(
    { ...state, nestedCounter: model },
    Cmd.map(cmd, updateNestedCounter)
  );
}

const todosReducer: LoopReducer<TodoState, TodoReducerActions> = (
  state = initialTodoState,
  action
) => {
  switch (action.type) {
    case ADD_TODO:
      return loop(
        { ...state, todos: [...state.todos, action.text] },
        Cmd.list([
          Cmd.none,
          Cmd.action(noop()),
          Cmd.setTimeout(Cmd.none, 100, { scheduledActionCreator: noop }),
          Cmd.setInterval(Cmd.none, 100, { scheduledActionCreator: noop }),
          Cmd.clearTimeout(1),
          Cmd.clearInterval(1),
        ])
      );
    case NOOP:
      return state;
    case UPDATE_NESTED_COUNTER:
      return updateNestedCounterHandler(action, state);
    case FETCH_FOO_REQUEST:
      return loop(
        state,
        Cmd.run<
          () => Promise<string>,
          IFetchFooSuccess,
          IFetchFooFailure,
          CustomError
        >(apiFetchFoo, {
          successActionCreator: fetchFooSuccess,
          failActionCreator: fetchFooFailure,
        })
      );
    default:
      return loop(
        state,
        Cmd.list(
          [
            Cmd.none,
            Cmd.run(console.log, { args: ['log this', Cmd.getState] }),
            Cmd.run(dispatchNoop, { args: [Cmd.dispatch] }),
            Cmd.run(getState, { args: [1, Cmd.getState] }),
            Cmd.run(typedArgs, { args: [1, 'a', { n: 2 }] }),
          ],
          { sequence: true }
        )
      );
  }
};

const todoState: TodoState = <TodoState>todosReducer(
  { todos: [], nestedCounter: 0 },
  {
    type: ADD_TODO,
    text: 'test',
  }
);

type RootReducerActions = TodoReducerActions | CounterActions;

type RootState = {
  todos: TodoState;
  counter: CounterState;
};

const rootReducer = combineReducers<RootState>({
  todos: todosReducer,
  counter: counterReducer,
});

const rootState: RootState = rootReducer(undefined, {
  type: ADD_TODO,
  text: 'test',
})[0];

const cmd = Cmd.run(() => 1, {
  successActionCreator: (a: number) => ({ type: 'FOO', a: 2 * a }),
});
const action: AnyAction = cmd.simulate({ success: true, result: 123 });
const listCmd = Cmd.list([cmd, cmd]);
const actions: AnyAction[] = listCmd.simulate([
  { success: true, result: 123 },
  { success: false, result: 456 },
]);
const nestedListCmd = Cmd.list([cmd, listCmd]);
const flattenedActions: AnyAction[] = nestedListCmd.simulate([
  { success: true, result: 123 },
  [
    { success: true, result: 456 },
    { success: true, result: 789 },
  ],
]);

const enhancedCreateStore = createStore as StoreCreator;
const enhancer = install<TodoState>();

const storeWithPreloadedState = enhancedCreateStore(
  todosReducer,
  initialTodoState,
  enhancer
);

const storeWithoutPreloadedState = enhancedCreateStore(
  todosReducer,
  undefined,
  enhancer
);
