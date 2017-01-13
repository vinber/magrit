import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import multiEntry from 'rollup-plugin-multi-entry';

const babelOptions = {
  exclude: 'node_modules/**',
  presets: ['es2015-rollup', 'stage-0'],
  babelrc: false
};

export default {
  entry: ['src/**/*.js'],
  format: "iife",
  plugins: [
	multiEntry(),
    babel(babelOptions),
	],
  moduleName: 'app',
  dest: "dist/iife/window.min.js"
};
