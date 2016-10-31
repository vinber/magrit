import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import stage-0 from 'babel-preset-stage-0';
import es2015-rollup from 'babel-preset-es2015-rollup';

const babelOptions = {
  exclude: 'node_modules/**',
  presets: ['es2015-rollup', 'stage-0'],
  babelrc: false
};

export default {
  entry: './index.js',
  format: "iife",
  plugins: [
    babel(babelOptions),
    uglify()
	],
  moduleName: 'app',
  dest: "dist/iife/bundle.min.js"
};
