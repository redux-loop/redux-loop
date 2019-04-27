import { combineReducers } from '../src';
import { getModel } from '../src/loop';

const reducers = {
  counter: (state = 0) => state + 1,
  doubler: state => (state ? state + state : 1),
  fibonacci: (state = 1, action = {}) =>
    action.previous ? action.previous + state : state
};

describe('combineReducers', () => {
  it('works with one argument and returns correctly working reducer', () => {
    const appReducer = combineReducers(reducers);

    expect(typeof appReducer).toBe('function');

    let state = getModel(appReducer());
    expect(state).toEqual({ counter: 1, doubler: 1, fibonacci: 1 });

    let action = {
      type: 'NEXT FIBONACCI NUMBER',
      previous: 0
    };
    state = getModel(appReducer(state, action));
    expect(state).toEqual({ counter: 2, doubler: 2, fibonacci: 1 });

    action.previous = 1;
    state = getModel(appReducer(state, action));
    expect(state).toEqual({ counter: 3, doubler: 4, fibonacci: 2 });

    state = getModel(appReducer(state));
    expect(state).toEqual({ counter: 4, doubler: 8, fibonacci: 2 });

    action.previous = 1;
    state = getModel(appReducer(state, action));
    expect(state).toEqual({ counter: 5, doubler: 16, fibonacci: 3 });

    action.previous = 2;
    state = getModel(appReducer(state, action));
    expect(state).toEqual({ counter: 6, doubler: 32, fibonacci: 5 });
  });

  it('passes through extra params to each child reducer', () => {
    const extraParamReducers = {
      r1: (state = [], action, ...extra) => state.concat(extra),
      r2: (state = 0, action, extra) => state + extra
    };
    const appReducer = combineReducers(extraParamReducers);

    let state = getModel(appReducer(undefined, {}, 5, 6));
    expect(state).toEqual({ r1: [5, 6], r2: 5 });

    state = getModel(appReducer(state, {}, 1, 2));
    expect(state).toEqual({ r1: [5, 6, 1, 2], r2: 6 });
  });
});
