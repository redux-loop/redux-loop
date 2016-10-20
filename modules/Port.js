const { custom } = require('./Cmd')

const isPortSymbol = Symbol()

const PortProto = Object.freeze({
  send(...args) {
    return custom('Port.send', runPort, [args, this])
  }
})

const resolved = Promise.resolve()

const runPort = (args, port) => {
  return resolved.then(() => {
    port.callback(...args)
  })
}

const Port = (callback) => {
  const result = Object.create(PortProto)
  result[isPortSymbol] = true
  result.callback = callback
  return Object.freeze(result)
}

Port.isPort = (port) => {
  return typeof port === 'object'
    && port !== null
    && port.hasOwnProperty(isPortSymbol)
    && port[isPortSymbol] === true
}

module.exports = Port;
