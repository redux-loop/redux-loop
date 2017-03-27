export const loopPromiseCaughtError =
`
Promise inside your effect caught when returned from reducer.
Promise inside your effects must not throw!

Did you forget to do one of the following?

- Call \`.catch\` on a Promise in a function passed to \`Effects.fromLazyPromise\`

  const effect = Effects.fromLazyPromise(() => {
    return new Promise((resolve, reject) => {
      throw 'Something wrong happened!';
    })
    .catch(() => {         // <-- You forgot to do this!
      return {
        type: 'FAILURE',
      };
    });
  });

- Return an action from \`.then\` or \`.catch\` callback

  const effect = Effects.fromLazyPromise(() => {
    return new Promise((resolve, reject) => {
      /* Some side-effectful thingy */
    })
    .then(() => {          // <-- Make sure to return action here!
      return {
        type: 'SUCCESS',
      };
    })
    .catch(() => {         // <-- And return action here!
      return {
        type: 'FAILURE',
      };
    });
  });

Don't see the problem here? Please report the issue at <https://github.com/redux-loop/redux-loop/issues/new>
`;

export const promisePolyfill =
`
It looks like your environment do not support ES6 Promises.

To polyfill Promise you can use following package:

    https://github.com/stefanpenner/es6-promise
`;

export const effectCreatorIsWrong = 
`
It looks like function you passed to \`Effects.fromLazyPromise\` do not return actual Promise.

Did you forget to do one of the following?

- Forgot to return in function passed to \`Effects.fromLazyPromise\`

  Effects.fromLazyPromise(() => {
    Promise.resolve({ type: 'SOME_ACTION' });                   // <-- You need to return it
  });

- Returned something which is not actual Promise

  Effects.fromLazyPromise(() => 'I am string, not a Promise');  // <-- You need to return Promise instance
`;