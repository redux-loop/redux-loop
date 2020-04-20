import {
  Cmd,
  combineReducers,
  install,
  loop,
  Loop,
  LiftedLoopReducer,
  liftState,
  LoopReducer,
  StoreCreator,
} from '../../index';
import { AnyAction, createStore } from 'redux';

const FETCH_FOO_REQUEST = 'FETCH_FOO_REQUEST'
const FETCH_FOO_SUCCESS = 'FETCH_FOO_SUCCESS'
const FETCH_FOO_FAILURE = 'FETCH_FOO_FAILURE'

type TodoState = { todos: string[]; nestedCounter: number };

const initialTodoState: TodoState = { todos: [], nestedCounter: 0 };

type TodoActions =
  | {
      type: 'ADD_TODO';
      text: string;
    }
  | { type: 'NOOP' }
  | { type: 'UPDATE_NESTED_COUNTER'; subAction: CounterActions }
  | IFetchFooRequest
  | IFetchFooSuccess
  | IFetchFooFailure

const noop = (): TodoActions => ({
  type: 'NOOP'
});

const updateNestedCounter = (subAction: CounterActions): TodoActions => ({
  type: 'UPDATE_NESTED_COUNTER',
  subAction
});

interface IFetchFooRequest {
  type: typeof FETCH_FOO_REQUEST
}

interface IFetchFooSuccess {
  type: typeof FETCH_FOO_SUCCESS
}

const fetchFooSuccess = (result: string): IFetchFooSuccess => ({
  type: FETCH_FOO_SUCCESS,
})

interface IFetchFooFailure {
  type: typeof FETCH_FOO_FAILURE
}

class CustomError extends Error {
  public prop = 'myprop';
}

const fetchFooFailure = (err: CustomError): IFetchFooFailure => ({
  type: FETCH_FOO_FAILURE,
})

const apiFetchFoo = () => Promise.resolve("foo")

const todosReducer: LoopReducer<TodoState, TodoActions> = (
  state: TodoState = initialTodoState,
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
        Cmd.map(cmd, updateNestedCounter)
      );
    case FETCH_FOO_REQUEST:
      return loop(
        state,
        Cmd.run(apiFetchFoo, {
          successActionCreator: fetchFooSuccess,
          failActionCreator: fetchFooFailure,
        })
      )
    default:
      return loop(
        state,
        Cmd.list([
          Cmd.none,
          Cmd.run(console.log, { args: ['log this', Cmd.getState] }),
          Cmd.run(dispatchNoop, { args: [Cmd.dispatch] }),
          Cmd.run(getState, { args: [1, Cmd.getState] }),
          Cmd.run(typedArgs, { args: [1, 'a', { n: 2 }] })
        ], {sequence: true})
      );
  }
};

const dispatchNoop = (dispatch: Cmd.Dispatch): void => {
  dispatch(noop());
};

const getState = (n: number, getState: Cmd.GetState): void => {
  const s = getState();
};

const typedArgs = (a: number, b: string, c: { n: number }) => {};

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

let cmd = Cmd.run(() => 1, {
  successActionCreator: (a: number) => ({type: 'FOO', a: 2*a})
});
let actions: AnyAction[] = cmd.simulate({success: true, result: 123});
let listCmd = Cmd.list([cmd, cmd]);
actions= listCmd.simulate([{success: true, result: 123}, {success: false, result: 456}]);
let nestedListCmd = Cmd.list([cmd, listCmd]);
let flattenedActions: AnyAction[] = nestedListCmd.simulate([
  {success: true, result: 123},
  [
    {success: true, result: 456},
    {success: true, result: 789},
  ]
]);

const enhancedCreateStore = createStore as StoreCreator;
const enhancer = install<TodoState>();

const storeWithPreloadedState = enhancedCreateStore(
  todosReducer, initialTodoState, enhancer
);

const storeWithoutPreloadedState = enhancedCreateStore(
  todosReducer, undefined, enhancer
);
