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
  (state: S | undefined, action: AnyAction): S | Loop<S, A>;
}

export interface LiftedLoopReducer<S, A extends Action> {
  (state: S | undefined, action: AnyAction): Loop<S, A>;
}

export type CmdSimulation = {
  result: any,
  success: boolean
};
export interface MultiCmdSimulation {
  [index: number]: CmdSimulation | MultiCmdSimulation;
}

type SingleCmdSimulationFunction<A extends Action> = (simulation?: CmdSimulation) => A;
type MultiCmdSimulationFunction<A extends Action> = (simulations: MultiCmdSimulation) => A[];

export interface NoneCmd {
  type: 'NONE';
  simulate: SingleCmdSimulationFunction<AnyAction>;
}

export interface ListCmd<A extends Action> {
  type: 'LIST';
  cmds: CmdType<A>[];
  sequence?: boolean;
  batch?: boolean;
  simulate: MultiCmdSimulationFunction<A>;
}

export interface ActionCmd<A extends Action> {
  type: 'ACTION';
  actionToDispatch: A;
  simulate: SingleCmdSimulationFunction<A>;
}

export interface MapCmd<A extends Action> {
  type: 'MAP';
  tagger: ActionCreator<A>;
  nestedCmd: CmdType<A>;
  args: any[];
  simulate: SingleCmdSimulationFunction<A> | MultiCmdSimulationFunction<A>;
}

export interface RunCmd<A extends Action> {
  type: 'RUN';
  func: Function;
  args?: any[];
  failActionCreator?: ActionCreator<A>;
  successActionCreator?: ActionCreator<A>;
  forceSync?: boolean;
  simulate: SingleCmdSimulationFunction<A>;
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

declare class Cmd {
  static readonly dispatch: (action: Action) => void;
  static readonly getState: any;
  static readonly none: NoneCmd;
  static readonly action: <A extends Action>(action: A) => ActionCmd<A>;
  static readonly batch: <A extends Action>(cmds: CmdType<A>[]) => BatchCmd<A>;
  static readonly sequence: <A extends Action>(cmds: CmdType<A>[]) => SequenceCmd<A>;

  static readonly list: <A extends Action>(
    cmds: CmdType<A>[],
    options?: {
      batch?: boolean;
      sequence?: boolean;
    }
  ) => ListCmd<A>;

  static readonly map: <A extends Action, B extends Action>(
    cmd: CmdType<B>,
    tagger: (subAction: B) => A,
    args?: any[]
  ) => MapCmd<A>;

  static readonly run: <A extends Action>(
    f: Function,
    options?: {
      args?: any[];
      failActionCreator?: ActionCreator<A>;
      successActionCreator?: ActionCreator<A>;
      forceSync?: boolean;
    }
  ) => RunCmd<A>;
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

declare function liftState<S, A extends Action>(
  state: S | Loop<S, A>
): Loop<S, A>;

declare function isLoop(test: any): boolean;

declare function getModel<S>(loop: S | Loop<S, AnyAction>): S;

declare function getCmd<A extends Action>(a: any): CmdType<A> | null;
