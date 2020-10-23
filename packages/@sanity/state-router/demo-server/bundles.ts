import browserify from 'browserify'
import tsify from 'tsify'
import rebundler from 'rebundler'

const main = rebundler((cache, pkgCache) => {
  return browserify(require.resolve('./entry.tsx'), {
    cache: cache,
    packageCache: pkgCache,
    debug: true,
    fullPaths: true,
  }).plugin(tsify)
})

export default {
  '/browser/bundle.js'() {
    return main().bundle()
  },
}
