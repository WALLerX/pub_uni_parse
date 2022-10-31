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
    extensions: ['.Webpack.js', '.web.js', '.ts', '.js', '.jsx', '.tsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        exclude: [/node_modules/],
        use: { loader: 'ts-loader' }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        exclude: [/node_modules/],
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
            loader: 'style-loader'
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: function () {
                  return [
                    require('autoprefixer')
                  ];
                }
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          }
        ]
      },
    ]
  }
}: {
  entry: "./build/app.jsx",
  mode: process.env.NODE_ENV,
  output: {
    path: path.resolve(__dirname, './script/'),
    filename: "./app-bundle.js"
  },
  resolve: {
    extensions: ['.Webpack.js', '.web.js', '.ts', '.js', '.jsx', '.tsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        exclude: [/node_modules/],
        use: { loader: 'ts-loader' }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        exclude: [/node_modules/],
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
            loader: 'style-loader'
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: function () {
                  return [
                    require('autoprefixer')
                  ];
                }
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          }
        ]
      },
    ]
  }
}