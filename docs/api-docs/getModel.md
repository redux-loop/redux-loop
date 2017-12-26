# `getModel(loop): any`

* `loop: any` &ndash; any object.
* returns the model component of the array if the input is a `[any, Cmd]`
  pair, otherwise returns the input object.

## Notes

`getModel` lets you extract just the model component of an array returned by
`loop`. It's useful in testing if you need to extract out the model component
to do custom comparisons like `Immutable.is()`.
