const browserify = require('browserify')
const rebundler = require('rebundler')
const babelify = require('babelify')
const envify = require('envify')

const browser = rebundler((cache, pkgCache) => {
  return browserify(require.resolve('../browser.js'), {
    cache: cache,
    packageCache: pkgCache,
    debug: true,
    fullPaths: true
  })
    .transform(babelify)
    .transform(envify)
})


module.exports = {
  '/browser.js': () => browser().bundle()
}
