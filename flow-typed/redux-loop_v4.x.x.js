// @flow

import type { ActionCreator, StoreEnhancer, Store } from "redux";

declare module "redux-loop" {
  declare export type StoreCreator = <S, A>(
    reducer: LoopReducer<S, A>,
    preloadedState: S,
    enhancer: StoreEnhancer<S>
  ) => Store<S>;

  declare export type StoreCreatorExplicit<S, A> = (
    reducer: LoopReducer<S, A>,
    preloadedState: S,
    enhancer: StoreEnhancer<S>
  ) => Store<S>;

  declare export type Loop<S, A> = [S, CmdType<A>];

  declare export type LoopReducer<S, A> = (
    state: S | void,
    action: A,
    ...args: any[]
  ) => Loop<S, A> | S;

  declare export interface LiftedLoopReducer<S, A> {
    (state: S | void, action: A, ...args: any[]): Loop<S, A>;
  }

  declare export type CmdSimulation<R> = {
    result: R,
    success: boolean
  };

  declare export interface MultiCmdSimulation {
    [index: number]: CmdSimulation<any> | MultiCmdSimulation;
  }

  declare export interface NoneCmd {
    type: "NONE";
    simulate(): null;
  }

  declare export interface ListCmd<A> {
    type: "LIST";
    cmds: CmdType<A>[];
    sequence?: boolean;
    batch?: boolean;
    simulate(simulations: MultiCmdSimulation): A[];
  }

  declare export interface ActionCmd<A> {
    type: "ACTION";
    actionToDispatch: A;
    simulate(): A;
  }

  declare export interface MapCmd<A, B = any, C = any> {
    type: "MAP";
    tagger: ((...args:Array<C|B>) => A) | ((subAction: B) => A);
    nestedCmd: CmdType<A>;
    args: Array<C>;
    simulate(simulations?: CmdSimulation<any> | MultiCmdSimulation): A[] | A | null;
  }

  declare export interface RunCmd<A, B, C> {
    type: "RUN";
    func: (...args: Array<C>) => B;
    args?: Array<C>;
    failActionCreator?: ActionCreator<A, any>;
    successActionCreator?: ActionCreator<A, B>;
    forceSync?: boolean;
    simulate(simulation: CmdSimulation<B>): A;
  }

  declare export type SequenceCmd<A> = ListCmd<A>;
  declare export type BatchCmd<A> = ListCmd<A>;

  declare export type CmdType<A, B = any, C = any> =
    | ActionCmd<A>
    | ListCmd<A>
    | MapCmd<A>
    | NoneCmd
    | RunCmd<A, B, C>
    | BatchCmd<A>
    | SequenceCmd<A>;

  declare export function install<S, A>(): StoreEnhancer<S, A>;

  declare export function loop<S, A>(state: S, cmd: CmdType<A>): Loop<S, A>;

  declare function Cmd$action<A>(action: A): ActionCmd<A>;
  declare function Cmd$batch<A>(cmds: CmdType<A>[]): BatchCmd<A>;
  declare function Cmd$sequence<A>(cmds: CmdType<A>[]): SequenceCmd<A>;
  declare function Cmd$list<A>(
    cmds: CmdType<A>[],
    options?: {
      batch?: boolean,
      sequence?: boolean,
      testInvariants?: boolean
    }
  ): ListCmd<A>;

  declare function Cmd$map<A, B>(
    cmd: CmdType<B>,
    tagger: (subAction: B) => A
  ): MapCmd<A>;
  declare function Cmd$map<A, B, C>(
    cmd: CmdType<B>,
    tagger: (arg1: C, subAction: B) => A,
    args?: Array<C>
  ): MapCmd<A>;
  declare function Cmd$map<A, B, C>(
    cmd: CmdType<B>,
    tagger: (arg1: C, arg2: C, subAction: B) => A,
    args?: Array<C>
  ): MapCmd<A>;
  declare function Cmd$map<A, B, C>(
    cmd: CmdType<B>,
    tagger: (arg1: C, arg2: C, arg3: C, subAction: B) => A,
    args?: Array<C>
  ): MapCmd<A>;

  declare function Cmd$run<A, B, C>(
    f: (...args: Array<C>) => Promise<B> | B,
    options?: {
      args?: Array<C>,
      failActionCreator?: ActionCreator<A, any>,
      successActionCreator?: (...args: Array<B>) => A,
      forceSync?: boolean
    }
  ): RunCmd<A, B, C>;

  // hack to make Cmd$run work with Cmd.dispatch and Cmd.getState
  declare opaque type Dispatch: Symbol & <A: any>(a: A) => void;
  declare opaque type GetState: Symbol & <S: any>() => S;

  declare export var Cmd: {
    action: typeof Cmd$action,
    batch: typeof Cmd$batch,
    sequence: typeof Cmd$sequence,
    list: typeof Cmd$list,
    map: typeof Cmd$map,
    run: typeof Cmd$run,
    dispatch: Dispatch,
    getState: GetState,
    none: NoneCmd
  };

  declare export type ReducerMapObject<S, A> = {
    [K: $Keys<S>]: LoopReducer<$Values<S>, A>
  };

  declare export function combineReducers<S, A>(
    /* This can be improved. ReducerMapObject<S, A> doesn't work as expected */
    reducers: { [string]: Function }
  ): LiftedLoopReducer<S, A>;

  declare export function mergeChildReducers<S, A>(
    parentResult: Loop<S, A> | S,
    action: A,
    childMap: ReducerMapObject<S, A>
  ): Loop<S, A>;

  declare export function reduceReducers<S, A>(
    ...reducers: Array<LoopReducer<S, A>>
  ): LiftedLoopReducer<S, A>;

  declare export function liftState<S, A>(state: Loop<S, A> | S): Loop<S, A>;

  declare export function isLoop(test: any): boolean;

  declare export function getModel<S>(loop: Loop<S, any> | S): S;

  declare export function getCmd<A>(a: any): CmdType<A> | null;
}
