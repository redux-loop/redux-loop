const isEffectSymbol = Symbol('isEffect');

const effectTypes = {
  LEAF: 'LEAF',
  MAP: 'MAP',
};


export function toPromise(effect) {
  if(process.env.NODE_ENV === 'development') {
    if (!isEffect(effect)) {
      throw new Error('Given effect is not an effect instance.');
    }
  }

  switch (effect.type) {
    case effectTypes.LEAF:
      return effect.promiseCreator();
    case effectTypes.MAP:
      return toPromise(effect.effect).then((action) => effect.tagger(action));
  }
}

export function isEffect(object) {
  return object ? object[isEffectSymbol] : false;
}

export function fromLazyPromise(promiseCreator) {
  return {
    promiseCreator,
    type: effectTypes.LEAF,
    [isEffectSymbol]: true
  };
}

export function map(effect, tagger) {
  return {
    effect,
    tagger,
    type: effectTypes.MAP,
    [isEffectSymbol]: true
  };
}
