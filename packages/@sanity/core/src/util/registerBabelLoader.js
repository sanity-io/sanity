const fs = require('fs')
const path = require('path')

module.exports = (basePath) => {
  const configPath = path.join(basePath, '.babelrc')
  let babelConfig
  try {
    // eslint-disable-next-line no-sync
    babelConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (err) {
    if (err.code !== 'ENOENT') {
      /* eslint-disable no-console */
      console.warn('Failed to read babel config at %s:', configPath)
      console.warn(err)
      console.warn('\n\nFalling back to default babel config')
      /* eslint-enable no-console */
    }
  }

  if (!babelConfig) {
    try {
      // eslint-disable-next-line
      babelConfig = require(path.join(basePath, 'babel.config.js'))
    } catch (err) {
      // Ignore errors, use default configuration
      babelConfig = {
        compact: false,
        root: basePath,
        ignore: [path.join(basePath, 'node_modules')],
        extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
        test: /.*/,
        presets: [
          '@babel/preset-typescript',
          '@babel/preset-react',
          [
            '@babel/preset-env',
            {
              targets: {
                node: 'current',
              },
            },
          ],
        ],
        plugins: ['@babel/plugin-proposal-class-properties'],
      }
    }
  }

  require('@babel/register')(babelConfig)
}
