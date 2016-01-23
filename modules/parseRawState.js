import { isPlainObject, mapValues, trampoline } from './utils';
import { none, batch } from './effects';
import { isLoop, loop } from './loop';

function optimizeEffects(effects) {
  return batch(effects);
}

export function parseRawState(state) {

  const parseRawStateRecursive = trampoline(function recursive(state, effects) {

    if (!isPlainObject(state)) {
      return state;
    }

    if (isLoop(state)) {
      effects.push(state.effect);
      return () => recursive(state.model, effects);
    }

    const mappableRecursive = trampoline(recursive);
    return () => mapValues(state, (value) => mappableRecursive(value, effects));
  });

  const effects = [];
  const model = parseRawStateRecursive(state, effects);
  return loop(model, optimizeEffects(effects));
}
