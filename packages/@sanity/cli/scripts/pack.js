#!/usr/bin/env node
/* eslint-disable no-console, no-process-exit, no-sync */
const path = require('path')
const fse = require('fs-extra')
const webpack = require('webpack')
const klawSync = require('klaw-sync')

const shebangLoader = require.resolve('./shebang-loader')
const basedir = path.join(__dirname, '..')
const modulesDir = path.join(basedir, 'node_modules')
const isAllowedNativeModule = mod => {
  const modName = mod.path.slice(modulesDir.length + 1).split(path.sep)[0]
  return !['fsevents'].includes(modName)
}

console.log('Building CLI to a single file')

// Make sure there are no native modules
const isBinding = file => path.basename(file.path) === 'binding.gyp'
const bindings = klawSync(modulesDir, {nodir: true, filter: isBinding}).filter(
  isAllowedNativeModule
)

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
  mode: 'production',
  entry: {
    sanity: path.join(basedir, 'bin/entry.js')
  },
  output: {
    pathinfo: true,
    filename: 'sanity-cli.js',
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
        test: /node_modules[/\\](rc)[/\\]/,
        use: [{loader: shebangLoader}]
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

  const filtered = stats.compilation.warnings.filter(warn => {
    return (
      !warn.origin ||
      (warn.origin.userRequest.indexOf('spawn-sync.js') === -1 &&
        warn.origin.userRequest.indexOf('write-file-atomic') === -1)
    )
  })

  if (filtered.length > 0) {
    console.warn('=== [  Warnings  ]========')
    filtered.forEach(warn => {
      console.warn(warn.origin ? `\n${warn.origin.userRequest}:` : '\n')
      console.warn(`${warn}\n`)
    })
    console.warn('=== [ /Warnings  ]========\n')
  }

  if (stats.compilation.errors.length > 0) {
    console.error(stats.compilation.errors)
    process.exit(1)
  }

  // Make the file executable
  const outputPath = path.join(basedir, 'bin', 'sanity')
  fse.chmodSync(outputPath, 0o755)

  // Make paths more dynamic
  let replacePath = path.normalize(path.join(__dirname, '..'))
  try {
    const monorepoPkg = require('../../../../package.json')
    if (monorepoPkg.name === 'sanity') {
      replacePath = path.normalize(path.join(__dirname, '..', '..', '..', '..'))
    }
  } catch (reqErr) {
    // do nothing
  }

  const content = fse.readFileSync(outputPath, 'utf8')
  const replaceRegex = new RegExp(escapeRegex(`*** ${replacePath}`), 'ig')
  const normalized = content.replace(replaceRegex, '*** ')
  fse.writeFileSync(outputPath, normalized, 'utf8')

  console.log('Done packing.')
})

function escapeRegex(string) {
  return `${string}`.replace(/([?!${}*:()|=^[\]/\\.+])/g, '\\$1')
}
