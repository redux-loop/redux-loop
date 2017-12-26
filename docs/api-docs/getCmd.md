# `getCmd(loop): Cmd | null`

* `loop: any` &ndash; any object.
* returns the cmd component of the array if the input is a `[any, Cmd]`
  pair, otherwise returns `null`.

## Notes

`getCmd` lets you extract just the cmd component of an array returned by
`loop`. It's useful in testing if you need to separate the model and cmd and
test them separately.
