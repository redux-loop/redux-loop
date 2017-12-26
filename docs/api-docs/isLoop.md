# `isLoop(object): boolean`
 
* `object: any` &ndash; any object.
* returns whether the given object was created with the `loop` function.

## Notes

 `isLoop` lets you determine whether an object returned by a reducer includes an
 cmd. This function is useful for writing custom higher-order functionality on
 top of redux-loop's API, or for just writing your own combineReducers.
