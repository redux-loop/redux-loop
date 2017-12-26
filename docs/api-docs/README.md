# API Docs

Detailed documentation of the API is provided here. For a more gentle introduction, refer to the [tutorial](../tutorial/README.md)

* [`install()`](install.md)
* [`loop(state, cmd)`](loop.md)
* [`liftState(state)`](liftstate.md)
* [`getModel(loop)`](getmodel.md)
* [`getCmd(loop)`](getcmd.md)
* [`isLoop(object)`](isloop.md)
* [`Cmds`](cmds.md)
  * [`Cmd.none`](cmds.md#cmdnone)
  * [`Cmd.action(actionToDispatch)`](cmds.md#cmdactionactiontodispatch)
  * [`Cmd.run(func, options)`](cmds.md#cmdrunfunc-options)
  * [`Cmd.list(cmds, options)`](cmds.md#cmdlistcmds-options)
  * [`Cmd.map(cmd, higherOrderActionCreator, [...additionalArgs])`](cmds.md#cmdmapcmd-higherorderactioncreator-additionalargs)