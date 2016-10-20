const isCmdSymbol = Symbol()

const createCmd = (attrs) => {
  const result = { [isCmdSymbol]: true }
  for(var k in attrs) {
    result[k] = attrs[k]
  }
  return Object.freeze(result)
}

const custom = (name, execute, args) => {
  return createCmd({
    type: 'custom',
    execute,
    args,
    name,
  })
}

const map = (tagger, cmd) => {
  if (isNone(cmd)) {
    return cmd
  }

  return createCmd({
    type: 'map',
    tagger,
    child: cmd,
  })
}

const batch = (cmds) => {
  const filtered = cmds.filter((cmd) => !isNone(cmd))

  if (cmds.length === 0) {
    return none()
  }

  if (cmds.length === 1) {
    return cmds[0]
  }

  return createCmd({
    type: 'batch',
    cmds,
  })
}

const noneSingleton = createCmd({
  type: 'none'
})

const none = () => {
  return noneSingleton
}

const isCmd = (cmd) => {
  return typeof cmd === 'object'
    && cmd !== null
    && cmd.hasOwnProperty(isCmdSymbol)
    && cmd[isCmdSymbol] === true
}

const isNone = (cmd) => {
  return isCmd(cmd) && cmd.type === 'none'
}

const resolved = Promise.resolve([])

const flatten = (array) => Array.prototype.concat.apply([], array)

const singletonOrEmpty = (thing) => typeof thing === 'undefined' ? [] : [thing]

const execute = (cmd) => {
  switch (cmd.type) {
    case 'none':
      return resolved

    case 'map':
      return execute(cmd.child).then((actions) => actions.map(cmd.tagger))

    case 'batch':
      return Promise.all(cmd.cmds.map(execute)).then(flatten)

    case 'custom':
      return cmd.execute(...cmd.args).then(singletonOrEmpty)
  }
}

module.exports = { custom, map, batch, none, execute, isCmd, isNone }
