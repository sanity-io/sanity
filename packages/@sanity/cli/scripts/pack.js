#!/usr/bin/env node
/* eslint-disable no-console, no-process-exit, no-sync */
const fse = require('fs-extra')
const path = require('path')
const webpack = require('webpack')
const klawSync = require('klaw-sync')

const lazyLoader = require.resolve('./lazy-loader')
const shebangLoader = require.resolve('./shebang-loader')
const basedir = path.join(__dirname, '..')

// Make sure there are no native modules
const isBinding = file => path.basename(file.path) === 'binding.gyp'
const bindings = klawSync(basedir, {nodir: true, filter: isBinding})

if (bindings.length > 0) {
  console.error('Eek! Found native module at:')
  bindings.forEach(file => console.error(file.path))
  process.exit(1)
}

const opnDir = path.dirname(require.resolve('opn'))
const xdgPath = path.join(opnDir, 'xdg-open')
fse.copy(xdgPath, path.join(basedir, 'bin', 'xdg-open'))

const babelRc = JSON.parse(fse.readFileSync(path.join(basedir, '.babelrc'), 'utf8'))

// Use the real node __dirname and __filename in order to get Yarn's source
// files on the user's system. See constants.js
const nodeOptions = {
  __filename: false,
  __dirname: false
}

const compiler = webpack({
  entry: {
    sanity: path.join(basedir, 'bin/sanity.js')
  },
  output: {
    filename: 'sanity',
    path: path.join(basedir, 'bin'),
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{loader: 'babel-loader', options: babelRc}]
      },
      {
        test: /node_modules[/\\]rc[/\\]/,
        use: [{loader: shebangLoader}]
      },
      {
        test: /node_modules[/\\]update-notifier[/\\].*\.js$/,
        use: [{loader: lazyLoader}]
      }
    ]
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true
    }),
    new webpack.DefinePlugin({
      __SANITY_IS_BUNDLED__: JSON.stringify(true),

      // Workaround for rc module console.logging if module.parent does not exist
      'module.parent': JSON.stringify({})
    })
  ],
  target: 'node',
  node: nodeOptions
})

compiler.run((err, stats) => {
  if (err) {
    throw err
  }

  if (stats.compilation.errors.length > 0) {
    console.error(stats.compilation.errors)
    process.exit(1)
  }

  // Make the file executable
  const outputPath = path.join(basedir, 'bin', 'sanity')
  fse.chmodSync(outputPath, 0o755)

  console.log('Done packing.')
})
