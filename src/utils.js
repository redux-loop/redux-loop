const concat = Array.prototype.concat;


export const flatten = (array) => {
  return concat.apply([], array)
}


export const throwInvariant = (condition, message) => {
  if(!condition) {
    throw Error(message)
  }
}


export const mapValues = (object, mapper) => {
  return Object.keys(object).reduce((current, key) => {
    current[key] = mapper(object[key], key)
    return current
  }, {})
}


export const promisify = (nodeStyleFunction) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      nodeStyleFunction(...args, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })
  }
}


export const isPromiseLike = (obj) => {
  return typeof obj === 'object' && typeof obj.then === 'function'
}
