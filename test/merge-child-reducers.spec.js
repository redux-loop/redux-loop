// eslint-disable-next-line camelcase
import { loop, Cmd, DEPRECATED_mergeChildReducers } from '../src';

let adder = (state = 0, { value }) => state + value;
let multiplier = (state = 1, { value }) => state * value;
let adderCmd = (state = 0, { value }) =>
  loop(state + value, Cmd.action({ type: 'add' }));
let multiplierCmd = (state = 1, { value }) =>
  loop(state * value, Cmd.action({ type: 'multiply' }));

function foo() {}

describe('DEPRECATED_mergeChildReducers', function() {
  it('runs each child reducer and merges it onto the parent result, and returns a loop with Cmd.none', function() {
    let state = {
      foo: 'bar',
      adder: 2,
      multiplier: 3
    };
    const result = DEPRECATED_mergeChildReducers(
      state,
      { type: 'foo', value: 5 },
      { adder, multiplier }
    );
    let newState = {
      foo: 'bar',
      adder: 7,
      multiplier: 15
    };

    expect(result).toEqual(loop(newState, Cmd.none));
  });

  it('creates the child properties if they do not exist already (and runs them with undefined state)', function() {
    let state = {
      foo: 'bar'
    };
    const result = DEPRECATED_mergeChildReducers(
      state,
      { type: 'foo', value: 3 },
      { adder, multiplier }
    );
    let newState = {
      foo: 'bar',
      adder: 3,
      multiplier: 3
    };
    expect(result).toEqual(loop(newState, Cmd.none));
  });

  it('runs cmd from the parent result if it is a loop', function() {
    const result = DEPRECATED_mergeChildReducers(
      loop({}, Cmd.run(foo)),
      { type: 'foo', value: 2 },
      { adder, multiplier }
    );
    let newState = {
      adder: 2,
      multiplier: 2
    };
    expect(result).toEqual(loop(newState, Cmd.run(foo)));
  });

  it('combines parent and children cmds together in a list', function() {
    let map = { adderCmd, multiplierCmd };
    let state = {
      foo: 'bar',
      adderCmd: 3,
      multiplierCmd: 5
    };
    const result = DEPRECATED_mergeChildReducers(
      loop(state, Cmd.run(foo)),
      { type: 'foo', value: 10 },
      map
    );
    let newState = {
      foo: 'bar',
      adderCmd: 13,
      multiplierCmd: 50
    };
    let expectedCmds = [
      Cmd.run(foo),
      Cmd.action({ type: 'add' }),
      Cmd.action({ type: 'multiply' })
    ];
    expect(result).toEqual(loop(newState, Cmd.list(expectedCmds)));
  });

  it('will not add a child cmd to a list if it is the only one', function() {
    let map = { adder, multiplierCmd };
    let state = {
      foo: 'bar',
      adder: 3,
      multiplierCmd: 5
    };
    const result = DEPRECATED_mergeChildReducers(
      state,
      { type: 'foo', value: 10 },
      map
    );
    let newState = {
      foo: 'bar',
      adder: 13,
      multiplierCmd: 50
    };
    expect(result).toEqual(loop(newState, Cmd.action({ type: 'multiply' })));
  });

  it('removes slices of state that have null for their reducers in the map', function() {
    let state = {
      foo: 'bar',
      adder: 2,
      multiplier: 3
    };
    const result = DEPRECATED_mergeChildReducers(
      state,
      { type: 'foo', value: 5 },
      { adder: null, multiplier }
    );
    let newState = {
      foo: 'bar',
      multiplier: 15
    };
    expect(result).toEqual(loop(newState, Cmd.none));
  });

  it('passes extra params through to the child reducers', function() {
    let state = {
      foo: 'bar'
    };

    const r1 = (state = [], action, ...extra) => state.concat(extra);
    const r2 = (state = 0, action, extra) => state + extra;

    const result = DEPRECATED_mergeChildReducers(
      state,
      { type: 'foo', value: 5 },
      { r1, r2 },
      5,
      6
    );
    let newState = {
      foo: 'bar',
      r1: [5, 6],
      r2: 5
    };
    expect(result).toEqual(loop(newState, Cmd.none));
  });
});
