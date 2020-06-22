import batchCmds from './batch-cmds';
import { loop, isLoop, getModel, getCmd } from './loop';

export default (...reducers) => (prevState, action, ...args) => {
  const { newState, cmds } = reducers.reduce(
    (prevResult, reducer) => {
      const result = reducer(prevResult.newState, action, ...args);
      if (isLoop(result)) {
        return {
          newState: getModel(result),
          cmds: [...prevResult.cmds, getCmd(result)]
        };
      }
      return { newState: result, cmds: prevResult.cmds };
    },
    { newState: prevState, cmds: [] }
  );

  return loop(newState, batchCmds(cmds));
};
