var webpack = require('webpack');
const exec = require('child_process').exec;

module.exports = {
  entry: {
    app: './js/main.js',
  },
  output: {
    filename: 'app.js'
  },
  mode: 'development',
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: [
          /node_modules/
        ]
      },
     {
       test:/\.css$/,
       use:['style-loader','css-loader']
     }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
        'Promise': 'bluebird'
    }),
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
          exec('./post_build.sh', (err, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);
          });
        });
      }
    }
  ],
  watchOptions: {
    poll: true
  }
};
