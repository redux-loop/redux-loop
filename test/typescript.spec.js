import * as ts from 'typescript';
import * as tt from 'typescript-definition-tester';

describe('TypeScript definitions', function() {
  it('should compile against index.d.ts', done => {
    tt.compileDirectory(
      __dirname + '/typescript',
      fileName => fileName.match(/\.ts$/),
      // This matches what's in tsconfig.json
      { target: ts.ScriptTarget.ES2017 },
      error => done(error)
    );
  });
});
