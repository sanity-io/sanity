const sass = require('node-sass')

module.exports = {
  '/styles.css'(callback) {
    sass.render({
      file: require.resolve('../styles.scss'),
      sourceComments: 'map',
      omitSourceMapUrl: true,
      outputStyle: 'nested'
    }, (err, result) => callback(err, result && result.css))
  }
}
