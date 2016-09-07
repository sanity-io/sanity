import browserify from 'browserify'
import babelify from 'babelify'
import rebundler from 'rebundler'

const main = rebundler((cache, pkgCache) => {
  return browserify(require.resolve('./entry.js'), {
    cache: cache,
    packageCache: pkgCache,
    debug: true,
    fullPaths: true,
  })
    .transform(babelify)
})

export default {
  '/browser/bundle.js'() {
    return main().bundle()
  }
}
