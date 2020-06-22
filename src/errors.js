export const loopPromiseCaughtError = (originalActionType, error) =>
  `
Exception thrown when running Cmds from action: ${originalActionType}.

Thrown exception: 
${error}
`;
