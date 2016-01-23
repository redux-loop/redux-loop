const concat = Array.prototype.concat;
const fnToString = (fn) => Function.prototype.toString.call(fn);
const objStringValue = fnToString(Object);


/**
 * Flattens an array one level
 */
export function flatten(array) {
  return concat.apply([], array);
}


/**
 * Throws with message if condition is false.
 * @param {Boolean} condition The condition to assert.
 * @param {String} message The message of the error to throw.
 */
export function throwInvariant(condition, message) {
  if(!condition) {
    throw Error(message);
  }
}


/**
 * Maps over each value in an object and creates a new object with the mapped
 * values assigned to each key.
 * @param {Object} object The source object.
 * @param {Function} mapper The mapper function that receives the value and the key.
 * @returns {Object} A new object that contains the mapped values for the keys.
 */
export function mapValues(object, mapper) {
  return Object.keys(object).reduce((current, key) => {
    current[key] = mapper(object[key], key);
    return current;
  }, {});
}


/**
 * https://github.com/rackt/redux/blob/v3.0.5/src/utils/isPlainObject.js
 *
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
export function isPlainObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const proto = typeof obj.constructor === 'function' ?
    Object.getPrototypeOf(obj) :
    Object.prototype;

  if (proto === null) {
    return true;
  }

  const constructor = proto.constructor;

  return typeof constructor === 'function'
    && constructor instanceof constructor
    && fnToString(constructor) === objStringValue;
}


export function trampoline(fn) {
  return (...args) => {
    let result = fn(...args);

    while (result instanceof Function) {
      result = result();
    }

    return result;
  }
}
