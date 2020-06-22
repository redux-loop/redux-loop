import Cmd from './cmd';

export default function batchCmds(cmds) {
  switch (cmds.length) {
    case 0:
      return Cmd.none;
    case 1:
      return cmds[0];
    default:
      return Cmd.list(cmds);
  }
}
