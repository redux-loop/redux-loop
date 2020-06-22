import { loop, Cmd, reduceReducers, combineReducers } from '../src';

const initialState = {
  add: 0,
  mult: 2,
};

const addCmd = Cmd.action({ type: 'add' });
const multCmd = Cmd.action({ type: 'multiply' });

let adder = (state = initialState, { value }) => ({
  ...state,
  add: state.add + value,
});
let multiplier = (state, { value }) => ({ ...state, mult: state.mult * value });
let adderCmd = (state, { value }) =>
  loop({ ...state, add: state.add + value }, addCmd);
let multiplierCmd = (state = 1, { value }) =>
  loop({ ...state, mult: state.mult * value }, multCmd);

describe('reduceReducers', function () {
  it('runs all reducers and merges them into a single result with Cmd.none', function () {
    const state = {
      add: 5,
      mult: 7,
    };
    const reducer = reduceReducers(adder, multiplier);
    const newState = {
      add: 10,
      mult: 35,
    };
    const action = { type: 'change', value: 5 };
    expect(reducer(state, action)).toEqual(loop(newState, Cmd.none));
  });

  it("uses the first reducer's initial state with an undefined state", function () {
    const reducer = reduceReducers(adder, multiplier);
    const action = { type: 'change', value: 5 };
    const newState = {
      add: 5,
      mult: 10,
    };
    expect(reducer(initialState, action)).toEqual(loop(newState, Cmd.none));
  });

  it('combines child cmds', function () {
    const reducer = reduceReducers(adderCmd, multiplierCmd);
    const action = { type: 'change', value: 5 };
    const newState = {
      add: 5,
      mult: 10,
    };
    const cmd = Cmd.list([addCmd, multCmd]);
    expect(reducer(initialState, action)).toEqual(loop(newState, cmd));
  });

  it('will not add a child cmd to a list if it is the only one', function () {
    const reducer = reduceReducers(adder, multiplierCmd);
    const action = { type: 'change', value: 5 };
    const newState = {
      add: 5,
      mult: 10,
    };
    expect(reducer(initialState, action)).toEqual(loop(newState, multCmd));
  });

  it('passes extra params through to each child reducer', function () {
    const state = {
      r1: [],
      r2: 0,
    };

    const r1 = (state, action, ...extra) => ({
      ...state,
      r1: state.r1.concat(extra),
    });
    const r2 = (state, action, extra) => ({
      ...state,
      r2: state.r2 + extra,
    });

    const reducer = reduceReducers(r1, r2);
    const newState = {
      r1: [5, 6],
      r2: 5,
    };
    const action = { type: 'change', value: 5 };
    expect(reducer(state, action, 5, 6)).toEqual(loop(newState, Cmd.none));
  });

  describe('used together with combineReducers', function () {
    const divideCmd = Cmd.action({ type: 'divide' });
    const sideEffectCmd = Cmd.action({ type: 'side-effect' });
    let multiplierCmd = (state, { value }) => loop(state * value, multCmd);
    let adderCmd = (state, { value }) => loop(state + value, addCmd);
    let dividerCmd = (state, { value }) => {
      const newState = Object.keys(state).reduce(
        (acc, key) => ({ ...acc, [key]: state[key] / value }),
        {}
      );
      return loop(newState, Cmd.list([divideCmd, sideEffectCmd]));
    };
    const initialState = {
      add: 9,
      mult: 27,
    };
    const combinedReducer = combineReducers({
      add: adderCmd,
      mult: multiplierCmd,
    });
    const action = { type: 'change', value: 3 };

    it('works when combined reducer follows other reducer', () => {
      const reducer = reduceReducers(dividerCmd, combinedReducer);
      const newState = {
        add: 6,
        mult: 27,
      };
      const cmd = Cmd.list([
        Cmd.list([divideCmd, sideEffectCmd]),
        Cmd.list([addCmd, multCmd]),
      ]);
      expect(reducer(initialState, action)).toEqual(loop(newState, cmd));
    });

    it('works when combined reducer precedes other reducer', () => {
      const reducer = reduceReducers(combinedReducer, dividerCmd);
      const newState = {
        add: 4,
        mult: 27,
      };
      const cmd = Cmd.list([
        Cmd.list([addCmd, multCmd]),
        Cmd.list([divideCmd, sideEffectCmd]),
      ]);
      expect(reducer(initialState, action)).toEqual(loop(newState, cmd));
    });

    it('works when the other reducer both follow and precedes combined reducer', () => {
      const reducer = reduceReducers(dividerCmd, combinedReducer, dividerCmd);
      const newState = {
        add: 2,
        mult: 9,
      };
      const cmd = Cmd.list([
        Cmd.list([divideCmd, sideEffectCmd]),
        Cmd.list([addCmd, multCmd]),
        Cmd.list([divideCmd, sideEffectCmd]),
      ]);
      expect(reducer(initialState, action)).toEqual(loop(newState, cmd));
    });
  });
});
