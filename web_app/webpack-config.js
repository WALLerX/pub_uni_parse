const path = require('path');

module.exports = (process.env.NODE_ENV == "development")? {
  devtool: 'source-map',
  entry: "./src/app.tsx",
  mode: process.env.NODE_ENV,
  output: {
    path: path.resolve(__dirname, './script/'),
    filename: "./app-bundle.js"
  },
  resolve: {
    extensions: ['.Webpack.js', '.web.js', '.ts', '.js', '.jsx', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  }
}: {
  entry: "./src/app.tsx",
  mode: process.env.NODE_ENV,
  output: {
    path: path.resolve(__dirname, './script/'),
    filename: "./app-bundle.js"
  },
  resolve: {
    extensions: ['.Webpack.js', '.web.js', '.ts', '.js', '.jsx', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  }
}