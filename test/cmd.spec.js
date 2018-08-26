import Cmd, {isCmd, executeCmd} from '../src/cmd';

function actionCreator1(val){
  return {type: 'TYPE1', val};
}

function actionCreator2(val){
  return {type: 'TYPE2', val};
}

describe('Cmds', () => {
  let dispatch, getState, sideEffect;
  beforeEach(() => {
    dispatch = jest.fn();
    getState = jest.fn();
    sideEffect = jest.fn();
  });

  describe('isCmd', () => {
    it('returns true if and only if the object is a Cmd', () => {
      let cmd = Cmd.run(() => {});
      let cmd2 = Cmd.none;
      let notCmd = {foo: 'bar'};
      expect(isCmd(cmd)).toBe(true);
      expect(isCmd(cmd2)).toBe(true);
      expect(isCmd(notCmd)).toBe(false);
    });
  });

  describe('executeCmd with ', () => {
    describe('Cmd.run', () => {
      describe('with no handlers', () => {
        it('runs the passed in function and returns null', () => {
          let cmd = Cmd.run(sideEffect);
          expect(executeCmd(cmd, dispatch, getState)).toBe(null);
          expect(sideEffect.mock.calls.length).toBe(1);
        });

        it('resolves with an empty array if the function returns a resolved promise', async () => {
          sideEffect.mockReturnValueOnce(Promise.resolve(123));
          let cmd = Cmd.run(sideEffect);
          let result = executeCmd(cmd, dispatch, getState);
          expect(sideEffect.mock.calls.length).toBe(1);
          await expect(result).resolves.toEqual([]);
        });

        it('resolves with an empty array if the function returns a rejected promise', async () => {
          let consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
          sideEffect.mockReturnValueOnce(Promise.reject(123));
          let cmd = Cmd.run(sideEffect);
          let result = executeCmd(cmd, dispatch, getState);
          expect(sideEffect.mock.calls.length).toBe(1);
          await expect(result).resolves.toEqual([]);
          expect(consoleErr).toHaveBeenCalled();
          consoleErr.mockRestore();
        });

        it('rethrows the thrown error if the function throws', function(){
          let consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
          let err = new Error('foo');
          sideEffect.mockImplementationOnce(() => {throw err});
          let cmd = Cmd.run(sideEffect);
          expect(() => executeCmd(cmd, dispatch, getState)).toThrow(err);
          consoleErr.mockRestore();
        });

        it('calls console.error if the sideEffect has an error instead of swallowing the error completely', async function(){
          let consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
          let err = new Error("foo")
          sideEffect.mockReturnValueOnce(Promise.reject(err));
          let cmd = Cmd.run(sideEffect);
          await executeCmd(cmd, dispatch, getState)
          expect(consoleErr).toHaveBeenCalledWith(err);
          consoleErr.mockRestore();
        });
      });

      describe('arguments', () => {
        it('passes arguments to the function', () => {
          let cmd = Cmd.run(sideEffect, {
            args: [123, 456]
          });
          executeCmd(cmd, dispatch, getState);
          expect(sideEffect.mock.calls[0]).toEqual([123, 456]);
        });

        it('replaces Cmd.getState and Cmd.dispatch with the actual values', () => {
          let cmd = Cmd.run(sideEffect, {
            args: [123, Cmd.getState, Cmd.getState, Cmd.dispatch, 456]
          });
          executeCmd(cmd, dispatch, getState);
          expect(sideEffect.mock.calls[0]).toEqual([123, getState, getState, dispatch, 456]);
        });
      });

      describe('success handlers', () => {
        it('runs the result through the success handler and resolves with it in an array', async () => {
          sideEffect.mockReturnValueOnce(123);
          let cmd = Cmd.run(sideEffect, {
            successActionCreator: actionCreator1,
            failActionCreator: actionCreator2
          });

          let result = executeCmd(cmd, dispatch, getState);
          await expect(result).resolves.toEqual([actionCreator1(123)]);
        });

        it('runs the resolution value (for promises) through the success handler and resolves with it in an array', async () => {
          sideEffect.mockReturnValueOnce(Promise.resolve(123));
          let cmd = Cmd.run(sideEffect, {
            successActionCreator: actionCreator1,
            failActionCreator: actionCreator2
          });

          let result = executeCmd(cmd, dispatch, getState);
          await expect(result).resolves.toEqual([actionCreator1(123)]);
        });

        it('runs the promise through the success action creator if forceSync is true', async () => {
          let returnValue = Promise.resolve(123);
          sideEffect.mockReturnValueOnce(returnValue);
          let cmd = Cmd.run(sideEffect, {
            forceSync: true,
            successActionCreator: actionCreator1
          });

          let result = executeCmd(cmd, dispatch, getState);
          await expect(result).resolves.toEqual([actionCreator1(returnValue)]);
        });
      });

      describe('fail handlers', () => {
        it('runs the thrown value through fail handler and resolves with it in an array', async () => {
          let err = new Error('foo');
          sideEffect.mockImplementationOnce(() => {throw err});
          let cmd = Cmd.run(sideEffect, {
            successActionCreator: actionCreator1,
            failActionCreator: actionCreator2
          });

          let result = executeCmd(cmd, dispatch, getState);
          await expect(result).resolves.toEqual([actionCreator2(err)]);
        });

        it('runs the rejection value (for promises) through the fail handler and resolves with it in an array', async () => {
          let consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
          sideEffect.mockReturnValueOnce(Promise.reject(123));
          let cmd = Cmd.run(sideEffect, {
            successActionCreator: actionCreator1,
            failActionCreator: actionCreator2
          });

          let result = executeCmd(cmd, dispatch, getState);
          await expect(result).resolves.toEqual([actionCreator2(123)]);
          consoleErr.mockRestore();
        });
      });
    });

    describe('Cmd.action', () => {
      it('resolves with the passed action in an array', async () => {
        let action = actionCreator1(123);
        let cmd = Cmd.action(action);
        let result = executeCmd(cmd, dispatch, getState);
        await expect(result).resolves.toEqual([action]);
      });
    });

    describe('Cmd.list', () => {
      let error;

      beforeEach(() => {
        jest.useFakeTimers();
        error = jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        jest.useRealTimers();
        error.mockRestore();
      });

      describe('when sequence is false', () => {
        describe('when batch is false', () => {
          const options = {batch: false, sequence: false};

          it('runs all passed cmds in parallel, dispatches all actions, and resolves with empty array', async () => {
            let promise1, promise4;
            sideEffect.mockImplementationOnce(() => {
              promise1 = new Promise(resolve => {
                setTimeout(() => resolve(123), 100);
              });
              return promise1;
            });
            sideEffect.mockImplementationOnce(() => 456);
            sideEffect.mockImplementationOnce(() => {
              promise4 = new Promise((resolve, reject) => {
                setTimeout(() => reject(789), 50);
              });
              return promise4;
            });

            let cmd1 = Cmd.run(sideEffect, {
              successActionCreator: actionCreator1
            });
            let cmd2 = Cmd.action(actionCreator1('hello'));
            let cmd3 = Cmd.run(sideEffect, {
              successActionCreator: actionCreator2
            });
            let cmd4 = Cmd.run(sideEffect, {
              failActionCreator: actionCreator2
            });

            //should take 100 ms if running in parallel
            let listCmd = Cmd.list([cmd1, cmd2, cmd3, cmd4], options);

            let result = executeCmd(listCmd, dispatch, getState);
            await jest.runTimersToTime(0);
            expect(dispatch).toHaveBeenCalledWith(actionCreator1('hello'));
            expect(dispatch).toHaveBeenCalledWith(actionCreator2(456));

            expect(dispatch).not.toHaveBeenCalledWith(actionCreator2(789));
            await jest.runTimersToTime(50);
            await promise4.catch(() => {}); //flushes the promise chain https://github.com/facebook/jest/issues/2157
            expect(dispatch).toHaveBeenCalledWith(actionCreator2(789));

            expect(dispatch).not.toHaveBeenCalledWith(actionCreator1(123));
            await jest.runTimersToTime(50);
            await promise1.then(() => {});
            expect(dispatch).toHaveBeenCalledWith(actionCreator1(123));

            await expect(result).resolves.toEqual([]);
          });

          it('returns null if there are no items', () => {
            let result = executeCmd(Cmd.list([], options), dispatch, getState);
            expect(result).toBe(null);
          });
        });

        describe('when batch is true', () => {
          const options = {batch: true, sequence: false};

          it('runs all passed cmds in parallel and resolves with an array of their resolve values', async () => {
            let cmd1Run = false, cmd4Run = false;
            sideEffect.mockImplementationOnce(() => {
              cmd1Run = true;
              return new Promise(resolve => {
                setTimeout(() => resolve(123), 100);
              });
            });
            sideEffect.mockImplementationOnce(() => 456);
            sideEffect.mockImplementationOnce(() => {
              cmd4Run = true;
              return new Promise((resolve, reject) => {
                setTimeout(() => reject(789), 100);
              });
            });

            let cmd1 = Cmd.run(sideEffect, {
              successActionCreator: actionCreator1
            });
            let cmd2 = Cmd.action(actionCreator1('hello'));
            let cmd3 = Cmd.run(sideEffect, {
              successActionCreator: actionCreator2
            });
            let cmd4 = Cmd.run(sideEffect, {
              failActionCreator: actionCreator2
            });

            //should take 100 ms if running in parallel
            let listCmd = Cmd.list([cmd1, cmd2, cmd3, cmd4], options);

            let result = executeCmd(listCmd, dispatch, getState);
            expect(cmd1Run).toBe(true);
            expect(cmd4Run).toBe(true);
            jest.runTimersToTime(100);
            await expect(result).resolves.toEqual([
              actionCreator1(123),
              actionCreator1('hello'),
              actionCreator2(456),
              actionCreator2(789)
            ]);
          });

          it('filters out items that don\'t resolve with actions', async () => {
            let action = actionCreator1(123);
            let run = Cmd.run(() => {});
            let listCmd = Cmd.list([Cmd.action(action), run], options);

            let result = executeCmd(listCmd, dispatch, getState);
            await expect(result).resolves.toEqual([action]);
          });

          it('returns null if there are no items', () => {
            let result = executeCmd(Cmd.list([], options), dispatch, getState);
            expect(result).toBe(null);
          });
        });
      });

      describe('when sequence is true', () => {
        describe('when batch is false', () => {
          const options = {batch: false, sequence: true};

          it('runs all passed cmds in series, dispatches all actions, and resolves with empty array', async () => {
            let promise1, promise2;
            sideEffect.mockImplementationOnce(() => {
              promise1 = new Promise(resolve => {
                setTimeout(() => resolve(123), 100);
              });
              return promise1;
            });
            sideEffect.mockImplementationOnce(() => {
              promise2 = new Promise((resolve, reject) => {
                setTimeout(() => reject(456), 100);
              });
              return promise2;
            });

            let cmd1 = Cmd.run(sideEffect, {
              successActionCreator: actionCreator1
            });
            let cmd2 = Cmd.run(sideEffect, {
              failActionCreator: actionCreator2
            });

            //should take 200 ms if running in series
            let listCmd = Cmd.list([cmd1, cmd2], options);
            let result = executeCmd(listCmd, dispatch, getState);

            expect(dispatch).not.toHaveBeenCalledWith(actionCreator1(123));
            await jest.runTimersToTime(100);
            await promise1.then(() => {}).then(() => {}).then(() => {}); //flushes the promise chain https://github.com/facebook/jest/issues/2157
            expect(dispatch).toHaveBeenCalledWith(actionCreator1(123));

            expect(dispatch).not.toHaveBeenCalledWith(actionCreator2(456));
            await jest.runTimersToTime(100);
            await promise2.catch(() => {});
            expect(dispatch).toHaveBeenCalledWith(actionCreator2(456));

            await expect(result).resolves.toEqual([]);
          });

          it('returns null if there are no items', () => {
            let result = executeCmd(Cmd.list([], options), dispatch, getState);
            expect(result).toBe(null);
          });
        });

        describe('when batch is true', () => {
          const options = {batch: true, sequence: true};

          it('runs all passed cmds in series and resolves with an array of their resolve values', async () => {
            let cmd1Run = false, cmd2Run = false, promise1;
            sideEffect.mockImplementationOnce(() => {
              cmd1Run = true;
              promise1 = new Promise(resolve => {
                setTimeout(() => resolve(123), 100);
              });
              return promise1;
            });
            sideEffect.mockImplementationOnce(() => {
              cmd2Run = true;
              return new Promise((resolve, reject) => {
                setTimeout(() => reject(456), 100);
              });
            });

            let cmd1 = Cmd.run(sideEffect, {
              successActionCreator: actionCreator1
            });
            let cmd2 = Cmd.run(sideEffect, {
              failActionCreator: actionCreator2
            });

            //should take 200 ms if running in series
            let listCmd = Cmd.list([cmd1, cmd2], options);
            let result = executeCmd(listCmd, dispatch, getState);
            expect(cmd1Run).toBe(true);
            expect(cmd2Run).toBe(false);
            await jest.runTimersToTime(100);
            await promise1.then(() => {}).then(() => {}); //flushes the promise chain https://github.com/facebook/jest/issues/2157
            expect(cmd2Run).toBe(true);
            jest.runTimersToTime(100);
            await expect(result).resolves.toEqual([
              actionCreator1(123),
              actionCreator2(456)
            ]);
          });

          it('filters out items that don\'t resolve with actions', async () => {
            let action = actionCreator1(123);
            let run = Cmd.run(() => {});
            let listCmd = Cmd.list([Cmd.action(action), run], options);

            let result = executeCmd(listCmd, dispatch, getState);
            await expect(result).resolves.toEqual([action]);
          });

          it('returns null if there are no items', () => {
            let result = executeCmd(Cmd.list([], options), dispatch, getState);
            expect(result).toBe(null);
          });
        });
      });
    });

    describe('Cmd.map', () => {
      it('returns null if the nested Cmd returns null', () => {
        let cmd = Cmd.map(Cmd.run(sideEffect), actionCreator1);
        let result = executeCmd(cmd, dispatch, getState);
        expect(result).toBe(null);
      });

      function noArgTagger(action){
        return actionCreator2(action)
      }

      function argTagger(arg1, arg2, action){
        let res = actionCreator2(action);
        res.arg1 = arg1;
        res.arg2 = arg2;
        return res;
      }

      it('runs the resulting actions through the tagger function before resolving with them', async () => {
        let action1 = actionCreator1(123), action2 = actionCreator1(456);
        let list = Cmd.list([Cmd.action(action1), Cmd.action(action2)], {batch: true});
        let cmd = Cmd.map(list, noArgTagger);
        let result = executeCmd(cmd, dispatch, getState);
        await expect(result).resolves.toEqual([actionCreator2(action1), actionCreator2(action2)]);
      });

      it('passes the args to the tagger if specified', async () => {
        let action1 = actionCreator1(123), action2 = actionCreator1(456);
        let list = Cmd.list([Cmd.action(action1), Cmd.action(action2)], {batch: true});
        let arg1 = 'arg1', arg2 = 'arg2';
        let cmd = Cmd.map(list, argTagger, arg1, arg2);
        let result = executeCmd(cmd, dispatch, getState);
        await expect(result).resolves.toEqual([
          {...actionCreator2(action1), arg1, arg2},
          {...actionCreator2(action2), arg1, arg2}
        ]);
      });
    });

    describe('Cmd.none', () => {
      it('returns null', () => {
        let result = executeCmd(Cmd.none, dispatch, getState);
        expect(result).toBe(null);
      });
    });
  });

  describe('simulate with ', () => {
    describe('Cmd.run', () => {
      describe('with no handlers', () => {
        it('returns null', () => {
          let cmd = Cmd.run(sideEffect);
          expect(cmd.simulate({result: 123, success: true})).toBe(null);
        });
      });

      describe('on success', () => {
        it('runs the result through the success handler if there is one', () => {
          let cmd = Cmd.run(sideEffect, {
            successActionCreator: actionCreator1,
            failActionCreator: actionCreator2
          });

          expect(cmd.simulate({result: 123, success: true})).toEqual(actionCreator1(123));
        });

        it('returns null if there is no success hanlder', () => {
          let cmd = Cmd.run(sideEffect, {
            failActionCreator: actionCreator2
          });

          expect(cmd.simulate({result: 123, success: true})).toBe(null);
        });
      });

      describe('on fail', () => {
        it('runs the result through the fail handler if there is one', () => {
          let cmd = Cmd.run(sideEffect, {
            successActionCreator: actionCreator1,
            failActionCreator: actionCreator2
          });

          expect(cmd.simulate({result: 123, success: false})).toEqual(actionCreator2(123));
        });

        it('returns null if there is no fail hanlder', () => {
          let cmd = Cmd.run(sideEffect, {
            successActionCreator: actionCreator2
          });

          expect(cmd.simulate({result: 123, success: false})).toBe(null);
        });
      });
    });

    describe('Cmd.action', () => {
      it('returns the action', () => {
        let action = actionCreator1(123);
        let cmd = Cmd.action(action);
        expect(cmd.simulate()).toBe(action);
      });
    });

    describe('Cmd.list', () => {
      it('simulates each cmd with the corresponding simulation and returns an array of the results', () => {
        let cmd1 = Cmd.run(sideEffect, {
          successActionCreator: actionCreator1
        });
        let cmd2 = Cmd.action(actionCreator1('hello'));
        let cmd3 = Cmd.run(sideEffect, {
          failActionCreator: actionCreator2
        });

        let listCmd = Cmd.list([cmd1, cmd2, cmd3]);

        let simulations = [{success: true, result: 123}, {succes: false, result: 'ignored'}, {success: false, result: 456}];
        let result = listCmd.simulate(simulations);

        expect(result).toEqual([
          actionCreator1(123),
          actionCreator1('hello'),
          actionCreator2(456)
        ]);
      });

      it('filters out null results', () => {
        let cmd1 = Cmd.run(sideEffect, {
          successActionCreator: actionCreator1
        });
        let cmd2 = Cmd.action(actionCreator1('hello'));
        let cmd3 = Cmd.run(sideEffect);

        let listCmd = Cmd.list([cmd1, cmd2, cmd3]);

        let simulations = [{success: true, result: 123}, {succes: false, result: 'ignored'}, {success: false, result: 456}];
        let result = listCmd.simulate(simulations);

        expect(result).toEqual([
          actionCreator1(123),
          actionCreator1('hello')
        ]);
      });

      it('flattens nested results', () => {
        let cmd1 = Cmd.run(sideEffect, {
          successActionCreator: actionCreator1
        });
        let cmd2 = Cmd.list([
          Cmd.run(sideEffect, {failActionCreator: actionCreator2}),
          Cmd.run(sideEffect, {failActionCreator: actionCreator1})
        ]);

        let listCmd = Cmd.list([cmd1, cmd2]);

        let simulations = [
          {success: true, result: 123},
          [
            {succes: false, result: 456},
            {success: false, result: 789}
          ]
        ];
        let result = listCmd.simulate(simulations);

        expect(result).toEqual([
          actionCreator1(123),
          actionCreator2(456),
          actionCreator1(789)
        ]);
      });
    });

    describe('Cmd.map', () => {
      function noArgTagger(action){
        return actionCreator2(action)
      }

      function argTagger(arg1, arg2, action){
        let res = actionCreator2(action);
        res.arg1 = arg1;
        res.arg2 = arg2;
        return res;
      }

      it('simulates the nested cmd and runs the result through the tagger function', () => {
        let runCmd = Cmd.run(sideEffect, {successActionCreator: actionCreator1});
        let cmd = Cmd.map(runCmd, noArgTagger);
        expect(cmd.simulate({success: true, result: 123})).toEqual(noArgTagger(actionCreator1(123)));
      });

      it('returns null if the nested cmd simulates to null', () => {
        let runCmd = Cmd.run(sideEffect);
        let cmd = Cmd.map(runCmd, noArgTagger);
        expect(cmd.simulate({success: true, result: 123})).toBe(null);
      });

      it('passes the args through to the tagger if there are args', () => {
        let runCmd = Cmd.run(sideEffect, {successActionCreator: actionCreator1});
        let cmd = Cmd.map(runCmd, argTagger, 456, 789);
        expect(cmd.simulate({success: true, result: 123})).toEqual(argTagger(456, 789, actionCreator1(123)));
      });

      describe('when the nested simulation returns an array', () => {
        it('simulates the nested cmd and runs all of the result actions through the tagger function', () => {
          let list = Cmd.list([
            Cmd.run(sideEffect, {successActionCreator: actionCreator1}),
            Cmd.run(sideEffect, {failActionCreator: actionCreator2}),
          ]);

          let cmd = Cmd.map(list, noArgTagger);
          let result = cmd.simulate([{success: true, result: 123}, {success: false, result: 456}]);
          expect(result).toEqual([noArgTagger(actionCreator1(123)), noArgTagger(actionCreator2(456))]);
        });

        it('passes the args through to the tagger if there are args', () => {
          let list = Cmd.list([
            Cmd.run(sideEffect, {successActionCreator: actionCreator1}),
            Cmd.run(sideEffect, {failActionCreator: actionCreator2}),
          ]);

          let cmd = Cmd.map(list, argTagger, 'p1', 'p2');
          let result = cmd.simulate([{success: true, result: 123}, {success: false, result: 456}]);
          expect(result).toEqual([
            argTagger('p1', 'p2', actionCreator1(123)),
            argTagger('p1', 'p2', actionCreator2(456))
          ]);
        });
      });
    });

    describe('Cmd.none', () => {
      it('returns null', () => {
        expect(Cmd.none.simulate({success: true, result: 123})).toBe(null);
      });
    });
  });

  describe('disabling testInvariants', () =>{
    it('disables invariants on Cmd.run if you pass the disable invariant option', () => {
      let cmd = Cmd.run(sideEffect, {
        successActionCreator: () => ({type: '123'}),
        failActionCreator: () => ({type: '456'})
      });
      expect(cmd).toEqual(Cmd.run(sideEffect, {
        testInvariants: true,
        successActionCreator: expect.any(Function),
        failActionCreator: expect.any(Function)
      }));
    });

    it('disables invariants on Cmd.list if you pass the disable invariant option', () => {
      let cmd = Cmd.run(sideEffect);
      let listCmd = Cmd.list([Cmd.action({type: 'foo'}), cmd, Cmd.action({type: 'bar'})]);
      expect(listCmd).toEqual(Cmd.list(expect.arrayContaining([cmd]), {testInvariants: true}));
    });
  });

  describe('Cmd.batch', () => {
    let warn;
    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    it('creates a list with batch set to true and sequence set to false', async () => {
      let cmd1 = Cmd.run(sideEffect), cmd2 = Cmd.run(sideEffect);
      let batch = Cmd.batch([cmd1, cmd2]);
      expect(batch).toEqual(Cmd.list([cmd1, cmd2], {batch: true, sequence: false}));
    });
  });

  describe('Cmd.sequence', () => {
    let warn;
    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    it('creates a list with batch set to true and sequence set to true', async () => {
      let cmd1 = Cmd.run(sideEffect), cmd2 = Cmd.run(sideEffect);
      let batch = Cmd.sequence([cmd1, cmd2]);
      expect(batch).toEqual(Cmd.list([cmd1, cmd2], {batch: true, sequence: true}));
    });
  });
});
