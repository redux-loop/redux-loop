const { map, batch, none, isCmd } = require('./Cmd')
const Task = require('./Task')
const Port = require('./Port')
const install = require('./install')

const Cmd = { map, batch, none, isCmd }

module.exports = {
  install,
  Task,
  Port,
  Cmd
}
