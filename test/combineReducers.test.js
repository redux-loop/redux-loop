// import test from 'tape';
// import { combineReducers } from '../modules';
// import { getModel } from '../modules/loop';
// import { Map } from 'immutable';
//
// const reducers = {
//     counter: (state = 0, action = {}) => state + 1,
//     doubler: (state, action = {}) => state ? state + state : 1,
//     fibonacci: (state = 1, action = {}) => action.previous ? action.previous + state : state
// };
//
// test('combineReducers works with one argument and returns correctly working reducer', (t) => {
//     const appReducer = combineReducers(reducers);
//
//     t.equals(typeof appReducer, 'function');
//
//     let state = getModel(appReducer());
//     t.deepEqual(state, { counter: 1, doubler: 1, fibonacci: 1 });
//
//     let action = {
//         type: 'NEXT FIBONACCI NUMBER',
//         previous: 0
//     };
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state, { counter: 2, doubler: 2, fibonacci: 1 });
//
//     action.previous = 1;
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state, { counter: 3, doubler: 4, fibonacci: 2 });
//
//     state = getModel(appReducer(state));
//     t.deepEqual(state, { counter: 4,  doubler: 8, fibonacci: 2 });
//
//     action.previous = 1;
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state, { counter: 5, doubler: 16, fibonacci: 3 });
//
//     action.previous = 2;
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state, { counter: 6, doubler: 32, fibonacci: 5 });
//
//     t.end();
// });
//
// test('combineReducers works with custom data structure and returns correctly working reducer', (t) => {
//     const appReducer = combineReducers(
//         reducers,
//         Map(),
//         (child, key) => child.get(key),
//         (child, key, value) => child.set(key, value)
//     );
//
//     t.equals(typeof appReducer, 'function');
//
//     let state = getModel(appReducer());
//     t.deepEqual(state.toJS(), { counter: 1, doubler: 1, fibonacci: 1 });
//
//     let action = {
//         type: 'NEXT FIBONACCI NUMBER',
//         previous: 0
//     };
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state.toJS(), { counter: 2, doubler: 2, fibonacci: 1 });
//
//     action.previous = 1;
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state.toJS(), { counter: 3, doubler: 4, fibonacci: 2 });
//
//     state = getModel(appReducer(state));
//     t.deepEqual(state.toJS(), { counter: 4,  doubler: 8, fibonacci: 2 });
//
//     action.previous = 1;
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state.toJS(), { counter: 5, doubler: 16, fibonacci: 3 });
//
//     action.previous = 2;
//     state = getModel(appReducer(state, action));
//     t.deepEqual(state.toJS(), { counter: 6, doubler: 32, fibonacci: 5 });
//
//     t.end();
// });
