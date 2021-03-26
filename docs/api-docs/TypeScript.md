# `Typescript`

## Usage with `react-redux`

In order to use `redux-loop` within a  TypeScript React project, you'll need to import the type
overwrites for `react-redux` exposed by this package into your project.

 * Create a types overwrite file somewhere in your project(the naming scheme doesn't really matter):

```typescript
// typings/react-redux.d.ts

import 'redux-loop/react-redux'
```

 * And add that file to your `tsconfig.json`:

```json
{
  ...,
  "compilerOptions": {
    ...
    "typeRoots": [
      "typings",
      "node_modules/@types"
    ],
    ...
  },
  "files": [
    "typings/react-redux.d.ts"
  ],
  ...
}
```