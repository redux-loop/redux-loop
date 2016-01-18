/**
 * Throws with message if condition is false.
 */
export function throwInvariant(condition, message) {
  if(!condition) {
    throw Error(message);
  }
}
