import test from "tape";
import * as tt from "typescript-definition-tester";

test("TypeScript definitions should compile against index.d.ts", t => {
  tt.compileDirectory(
    __dirname + "/typescript",
    fileName => fileName.match(/\.ts$/),
    t.end
  );
});
