export const loopPromiseCaughtError = (originalActionType) =>
`
loop Promise caught when returned from action of type ${originalActionType}.
loop Promises must not throw!

Did you forget to do one of the following?

- Call \`.catch\` on a Promise in a function passed to \`Effects.promise\`

  const asyncEffect = (val) => {
    return api.doStuff(val)
      .then((stuff) => Actions.success(stuff))
      .catch((error) => Actions.failure(error)); // <-- You have to do this!
  };

- Return an action from a \`.catch\` callback

  const asyncEffect = (val) => {
    return api.doStuff(val)
      .then((stuff) => {
        return Actions.success(stuff); // <-- Make sure to return here!
      })
      .catch((error) => {
        return Actions.failure(error): // <-- And return here!
      });
  };

Don't see the problem here? Please report the issue at <https://github.com/raisemarketplace/redux-loop/issues/new>
`;
