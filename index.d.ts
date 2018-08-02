import { Action, ActionCreator, AnyAction, StoreEnhancer, Store } from 'redux';

export interface StoreCreator {
  <S, A extends Action>(
    reducer: LoopReducer<S, A>,
    preloadedState: S,
    enhancer: StoreEnhancer<S>
  ): Store<S>;
}

export type Loop<S, A extends Action> = [S, CmdType<A>];

export interface LoopReducer<S, A extends Action> {
  (state: S | undefined, action: AnyAction, ...args: any[]): S | Loop<S, A>;
}

export interface LiftedLoopReducer<S, A extends Action> {
  (state: S | undefined, action: AnyAction, ...args: any[]): Loop<S, A>;
}

export type CmdSimulation = {
  result: any,
  success: boolean
};
export interface MultiCmdSimulation {
  [index: number]: CmdSimulation | MultiCmdSimulation;
}

export interface NoneCmd {
  readonly type: 'NONE';
  simulate(): null;
}

export interface ListCmd<A extends Action> {
  readonly type: 'LIST';
  readonly cmds: CmdType<A>[];
  readonly sequence?: boolean;
  readonly batch?: boolean;
  simulate(simulations: MultiCmdSimulation): A[];
}

export interface ActionCmd<A extends Action> {
  readonly type: 'ACTION';
  readonly actionToDispatch: A;
  simulate(): A;
}

export interface MapCmd<A extends Action> {
  readonly type: 'MAP';
  readonly tagger: ActionCreator<A>;
  readonly nestedCmd: CmdType<A>;
  readonly args: any[];
  simulate(simulations?: CmdSimulation | MultiCmdSimulation): A[] | A | null
}

export interface RunCmd<A extends Action> {
  readonly type: 'RUN';
  readonly func: Function;
  readonly args?: any[];
  readonly failActionCreator?: ActionCreator<A>;
  readonly successActionCreator?: ActionCreator<A>;
  readonly forceSync?: boolean;
  simulate(simulation: CmdSimulation): A
}

//deprecated types
export type SequenceCmd<A extends Action> = ListCmd<A>;
export type BatchCmd<A extends Action> = ListCmd<A>;


export type CmdType<A extends Action> =
  | ActionCmd<A>
  | ListCmd<A>
  | MapCmd<A>
  | NoneCmd
  | RunCmd<A>
  | BatchCmd<A>
  | SequenceCmd<A>;

declare function install<S>(): StoreEnhancer<S>;

declare function loop<S, A extends Action>(
  state: S,
  cmd: CmdType<A>
): Loop<S, A>;

declare namespace Cmd {
  /**
   * A symbol that can be passed to a cmd object as an arg (from a reducer)
   * that will be replaced at the time the function is called with
   * the `dispatch` method from the store.
   */
  export const dispatch: symbol;
  /**
   * A symbol that can be passed to a cmd object as an arg (from a reducer)
   * that will be replaced at the time the function is called with
   * the `getState()` method from the store.
   */
  export const getState: symbol;
  /**
   * is a no-op effect that you can use for convenience when building custom
   * effect creators from the ones provided. Since it does not resolve to
   * an action it doesn't cause any side effects to actually occur.
   */
  export const none: NoneCmd;
  /**
   * allows you to schedule a plain action object for dispatch after
   * the current dispatch is complete. It can be useful for initiating
   * multiple sequences that run in parallel but don't need to communicate
   * or complete at the same time.
   */
  export function action<A extends Action>(action: A): ActionCmd<A>;
  export function batch<A extends Action>(cmds: CmdType<A>[]): BatchCmd<A>;
  export function sequence<A extends Action>(cmds: CmdType<A>[]): SequenceCmd<A>;

  /**
   * allows you to group cmd objects as a single cmd to be run all together.
   * Use the options to choose when you want the individual cmd objects to run and
   * when the resulting actions are dispatched. The default behavior is to run
   * each cmd object simultaneously and dispatch the results as soon as possible.
   *
   * @param cmds an array of cmd objects returned by any of the other cmd functions, or even nested calls to `Cmd.list`
   * @param options.sequence By default, asynchronous cmd objects all run immediately and in parallel. If sequence is true, each cmd object will wait for the previous cmd object to resolve before starting. Note: this does not have an effect if all cmd objects are synchronous.
   * @param options.batch By default, actions from nested cmd objects will be dispatched as soon as that cmd object finishes. If batch is true, no actions will be dispatched until all of the cmd objects are resolved/finished. The actions will then be dispatched all at once in the order of the original cmd array.
   */
  export function list<A extends Action>(
    cmds: CmdType<A>[],
    options?: {
      batch?: boolean;
      sequence?: boolean;
      testInvariants?: boolean;
    }
  ): ListCmd<A>;

  /**
   * allows you to take an existing cmd object from a nested reducer in your state
   * and lift it to a more general action in which the resulting action is nested.
   * This enables you to build your reducer in a fractal-like fashion, in which all
   * of the logic for a particular slice of your state is totally encapsulated and
   * actions can be simply directed to the reducer for that slice.
   */
  export function map<A extends Action, B extends Action>(
    cmd: CmdType<B>,
    tagger: (subAction: B) => A,
    args?: any[]
  ): MapCmd<A>;

  /**
   * allows you to declaratively schedule a function to be called with some arguments
   * and dispatch actions based on the results. This allows you to represent almost
   * any kind of runnable process to the store without sacrificing functional purity
   * or having to encapsulate implicit state outside of your reducer. Keep in mind,
   * functions that are handed off to the store with run() are never invoked in
   * the reducer, only by the store during your application's runtime.
   * You can invoke a reducer that returns a run() effect as many times as you want
   * and always get the same result by deep-equality without triggering any side-effect
   * function calls in the process
   */
  export function run<A extends Action>(
    f: Function,
    options?: {
      args?: any[];
      failActionCreator?: ActionCreator<A>;
      successActionCreator?: ActionCreator<A>;
      forceSync?: boolean;
    }
  ): RunCmd<A>;
}

export type ReducerMapObject<S, A extends Action = AnyAction> = {
  [K in keyof S]: LoopReducer<S[K], A>;
}

declare function combineReducers<S, A extends Action = AnyAction>(
  reducers: ReducerMapObject<S, A>
): LiftedLoopReducer<S, A>;

declare function mergeChildReducers<S, A extends Action = AnyAction>(
  parentResult: S | Loop<S, A>,
  action: AnyAction,
  childMap: ReducerMapObject<S, A>
): Loop<S, A>;

declare function reduceReducers<S, A extends Action = AnyAction>(
  ...reducers: Array<LoopReducer<S, A>>
): LiftedLoopReducer<S, A>;

/**
 * Automatically converts objects to loop() results. If the value was created with loop(), then the function behaves as an identity. Otherwise, it is lifted into a [any, Cmd] pair where the effect is Cmd.none. Useful for forcing reducers to always return a loop() result, even if they shortcut to just the model internally.
 * @param state an object which may be the state of the redux store, or an existing [any, Cmd] pair created by loop().
 */
declare function liftState<S, A extends Action>(
  state: S | Loop<S, A>
): Loop<S, A>;

declare function isLoop(test: any): boolean;

declare function getModel<S>(loop: S | Loop<S, AnyAction>): S;

declare function getCmd<A extends Action>(a: any): CmdType<A> | null;
