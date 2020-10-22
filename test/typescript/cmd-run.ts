/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Cmd } from '../../index';

function doStuffRequired(
  _id: string,
  _getState: Cmd.GetState,
  _dispatch: Cmd.Dispatch,
  check = false
): Promise<string> {
  return Promise.resolve(check ? 'huzzah' : 'boo');
}

// blatant error
Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123', 1, Cmd.dispatch, false],
});

Cmd.run(doStuffRequired, {
  args: ['123', Cmd.getState, Cmd.dispatch, false],
});

Cmd.run(doStuffRequired, {
  args: ['123', Cmd.getState, Cmd.dispatch],
});

Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123'],
});

Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123', undefined, Cmd.dispatch, false],
});

Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123', Cmd.getState, undefined, false],
});

Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123', undefined, undefined, false],
});

Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123', undefined, Cmd.dispatch],
});

Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123', Cmd.getState, undefined],
});

Cmd.run(doStuffRequired, {
  // @ts-expect-error
  args: ['123', undefined, undefined],
});

function doStuff(
  _id: string,
  _getState: Cmd.GetState | undefined,
  _dispatch?: Cmd.Dispatch,
  check = false
): Promise<string> {
  return Promise.resolve(check ? 'huzzah' : 'boo');
}

Cmd.run(doStuff, {
  args: ['123', Cmd.getState, Cmd.dispatch, false],
});

Cmd.run(doStuff, {
  args: ['123', Cmd.getState, Cmd.dispatch],
});

Cmd.run(doStuff, {
  // @ts-expect-error
  args: ['123'],
});

Cmd.run(doStuff, {
  args: ['123', undefined],
});

Cmd.run(doStuff, {
  args: ['123', Cmd.getState],
});

Cmd.run(doStuff, {
  args: ['123', undefined, Cmd.dispatch, false],
});

Cmd.run(doStuff, {
  args: ['123', Cmd.getState, undefined, false],
});

Cmd.run(doStuff, {
  args: ['123', undefined, undefined, false],
});

Cmd.run(doStuff, {
  args: ['123', undefined, Cmd.dispatch],
});

Cmd.run(doStuff, {
  args: ['123', Cmd.getState, undefined],
});

Cmd.run(doStuff, {
  args: ['123', undefined, undefined],
});

function doStuffNumber(
  _id: string,
  _getState: Cmd.GetState | number,
  _dispatch?: Cmd.Dispatch,
  check = false
): Promise<string> {
  return Promise.resolve(check ? 'huzzah' : 'boo');
}

Cmd.run(doStuffNumber, {
  args: ['123', Cmd.getState, Cmd.dispatch, false],
});

Cmd.run(doStuffNumber, {
  args: ['123', Cmd.getState, Cmd.dispatch],
});

Cmd.run(doStuffNumber, {
  args: ['123', 1],
});

Cmd.run(doStuffNumber, {
  args: ['123', Cmd.getState],
});

Cmd.run(doStuffNumber, {
  args: ['123', 1, Cmd.dispatch, false],
});

Cmd.run(doStuffNumber, {
  args: ['123', Cmd.getState, undefined, false],
});

Cmd.run(doStuffNumber, {
  args: ['123', 1, undefined, false],
});

Cmd.run(doStuffNumber, {
  args: ['123', 1, Cmd.dispatch],
});

Cmd.run(doStuffNumber, {
  args: ['123', Cmd.getState, undefined],
});

Cmd.run(doStuffNumber, {
  args: ['123', 1, undefined],
});
