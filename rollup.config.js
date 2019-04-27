import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import { terser } from "rollup-plugin-terser";

var env = process.env.NODE_ENV;
var config = {
  output: {
    format: 'umd',
    name: 'ReduxLoop'
  },
  plugins: [
    nodeResolve(),
    babel({
      exclude: 'node_modules/**'
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  ]
};

if (env === 'production') {

  config.plugins.push(terser());
}

export default config;
