import { combineReducers } from '../src';
import { getModel } from '../src/loop';
import { Map } from 'immutable';

const reducers = {
  counter: (state = 0, action = {}) => state + 1,
  doubler: (state, action = {}) => state ? state + state : 1,
  fibonacci: (state = 1, action = {}) => action.previous ? action.previous + state : state
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

  it('works with custom data structure and returns correctly working reducer', () => {
    let warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const appReducer = combineReducers(
      reducers,
      Map(),
      (child, key) => child.get(key),
      (child, key, value) => child.set(key, value)
    )

    expect(typeof appReducer).toBe('function');

    let state = getModel(appReducer());
    expect(state.toJS()).toEqual({ counter: 1, doubler: 1, fibonacci: 1 });

    let action = {
      type: 'NEXT FIBONACCI NUMBER',
      previous: 0
    };
    state = getModel(appReducer(state, action));
    expect(state.toJS()).toEqual({ counter: 2, doubler: 2, fibonacci: 1 });

    action.previous = 1;
    state = getModel(appReducer(state, action));
    expect(state.toJS()).toEqual({ counter: 3, doubler: 4, fibonacci: 2 });

    state = getModel(appReducer(state));
    expect(state.toJS()).toEqual({ counter: 4, doubler: 8, fibonacci: 2 });

    action.previous = 1;
    state = getModel(appReducer(state, action));
    expect(state.toJS()).toEqual({ counter: 5, doubler: 16, fibonacci: 3 });

    action.previous = 2;
    state = getModel(appReducer(state, action));
    expect(state.toJS()).toEqual({ counter: 6, doubler: 32, fibonacci: 5 });

    warn.mockRestore();
  });
});