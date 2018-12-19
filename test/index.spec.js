import { install, loop, Cmd, combineReducers } from '../src';
import { createStore } from 'redux';

describe('redux loop store enhancer', () => {
  it('a looped action gets dispatched after the action that initiated it is reduced', done => {
    let arbitraryValue = 0;
    const initialState = {
      prop1: {
        firstRun: false,
        secondRun: false,
        thirdRun: false,
        fourthRun: false
      },
      prop2: true,
    };

    const firstAction = { type: 'FIRST_ACTION' };
    const secondAction = { type: 'SECOND_ACTION' };
    const thirdSuccess = (value) => ({ type: 'THIRD_ACTION', payload: value });
    const thirdFailure = (error) => ({ type: 'THIRD_FAILURE' })
    const fourthAction = { type: 'FOURTH_ACTION' };
    const nestAction = (action) => ({ type: 'NESTED_ACTION', payload: action });

    const doThirdLater = (value) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(value)
        }, 1)
      });
    };

    const prop1Reducer = (state = initialState.prop1, action) => {
      switch(action.type) {
        case 'FIRST_ACTION':
          return loop(
            { ...state, firstRun: true },
            Cmd.list([
              Cmd.list([
                Cmd.action(secondAction),
                Cmd.none,
                Cmd.map(Cmd.action(fourthAction), nestAction)
              ]),
              Cmd.run(arg => arbitraryValue = arg, {args: [5]}),
              Cmd.run(doThirdLater, {
                successActionCreator: thirdSuccess,
                failActionCreator: thirdFailure,
                args: ['hello']
              }),
            ])
          );

        case 'SECOND_ACTION':
          return { ...state, secondRun: true };

        case 'THIRD_ACTION':
          return { ...state, thirdRun: action.payload };

        case 'NESTED_ACTION':
          return loop(
            state,
            Cmd.action(action.payload)
          );

        case 'FOURTH_ACTION':
          return { ...state, fourthRun: true };

        case 'FIFTH_ACTION':
          return { ...state, fifthRun: action.payload };

        default:
          return state;
      }
    }

    const prop2Reducer = (state = initialState.prop2, action) => {
      return state;
    };

    const finalReducer = combineReducers({
      prop1: prop1Reducer,
      prop2: prop2Reducer,
    });

    const store = createStore(finalReducer, initialState, install());

    const dispatchPromise = store.dispatch(firstAction)
    expect(store.getState()).toEqual(
      {
        prop1: {
          firstRun: true,
          secondRun: false,
          thirdRun: false,
          fourthRun: false,
        },
        prop2: true
      }
    );

    dispatchPromise.then(() => {
      expect(store.getState()).toEqual(
        {
          prop1: {
            firstRun: true,
            secondRun: true,
            thirdRun: 'hello',
            fourthRun: true,
          },
          prop2: true,
        }
      );

      expect(arbitraryValue).toBe(5);

      done();
    });
  });

  describe('dispatch', () => {
    it('should return the provided action after the dispatch promise resolves', (done) => {
      const firstAction = {type: 'FIRST_ACTION'};
      const downstreamAction = {type: 'DOWNSTREAM_ACTION'};
      const thunk = (dispatch) => Promise.resolve(dispatch(downstreamAction));
      const initialState = {
        firstRun: false,
        secondRun: false,
        thirdRun: false,
        fourthRun: false
      };
      const reducer = (state = initialState, action) => {
        switch (action.type) {
          case 'FIRST_ACTION':
            return loop(
              state,
              Cmd.run(thunk, {args: [Cmd.dispatch]})
            );

          case 'DOWNSTREAM_ACTION':
            return {...state, secondRun: true};

          default:
            return state;
        }
      };
      const store = createStore(reducer, initialState, install());

      store.dispatch(firstAction).then((result) => {
        expect(result).toEqual(firstAction);
        expect(store.getState().secondRun).toEqual(true);

        done();
      });
    });
  });
});
