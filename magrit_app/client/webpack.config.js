var webpack = require('webpack');

module.exports = {
  entry: {
    app: './js/main.js',
  },
  output: {
    filename: './dist/app.js'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: [
          /node_modules/
        ]
      }
    ]
  },
  plugins: []
};
