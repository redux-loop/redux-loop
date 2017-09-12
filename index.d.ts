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

export interface NoneCmd {
  type: 'NONE';
}

export interface ActionCmd<A extends Action> {
  type: 'ACTION';
  actionToDispatch: A;
}

export interface BatchCmd<A extends Action> {
  type: 'BATCH';
  cmds: CmdType<A>[];
}

export interface MapCmd<A extends Action> {
  type: 'MAP';
  tagger: ActionCreator<A>;
  nestedCmd: CmdType<A>;
  args: any[];
}

export interface RunCmd<A extends Action> {
  type: 'RUN';
  func: Function;
  options: {
    args: any[];
    failActionCreator: ActionCreator<A>;
    successActionCreator: ActionCreator<A>;
  };
}

export interface SequenceCmd<A extends Action> {
  type: 'Sequence';
  cmds: CmdType<A>[];
}

export type CmdType<A extends Action> =
  | ActionCmd<A>
  | BatchCmd<A>
  | MapCmd<A>
  | NoneCmd
  | RunCmd<A>
  | SequenceCmd<A>;

declare function install<S>(): StoreEnhancer<S>;

declare function loop<S, A extends Action>(
  state: S,
  loop: CmdType<A>
): Loop<S, A>;

declare class Cmd {
  static readonly dispatch: (action: Action) => void;
  static readonly getState: any;
  static readonly none: NoneCmd;
  static readonly action: <A extends Action>(action: A) => ActionCmd<A>;
  static readonly batch: <A extends Action>(cmds: CmdType<A>[]) => BatchCmd<A>;
  static readonly map: <A extends Action, B extends Action>(
    cmd: CmdType<B>,
    tagger: (subAction: B) => A,
    args?: any[]
  ) => MapCmd<A>;
  static readonly run: <A extends Action>(
    f: Function,
    options?: {
      args?: any[];
      failureActionCreator?: ActionCreator<A>;
      successActionCreator?: ActionCreator<A>;
    }
  ) => RunCmd<A>;
  static readonly sequence: <A extends Action>(
    cmds: CmdType<A>[]
  ) => SequenceCmd<A>;
}

export interface ReducerMapObject<T, A extends Action> {
  [key: string]: LoopReducer<T, A>;
}

declare function combineReducers<S, T>(
  reducers: ReducerMapObject<T, AnyAction>
): LiftedLoopReducer<S, AnyAction>;

declare function liftState<S, A extends Action>(
  state: S | Loop<S, A>
): Loop<S, A>;

declare function isLoop(test: any): boolean;

declare function getModel<S>(loop: S | Loop<S, AnyAction>): S;

declare function getCmd<A extends Action>(a: any): CmdType<A> | null;
