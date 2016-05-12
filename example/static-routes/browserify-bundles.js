import browserify from 'browserify'
import babelify from 'babelify'
import path from 'path'
import rebundler from 'rebundler'
import envify from 'loose-envify'

const main = rebundler((cache, pkgCache) => {
  return browserify(require.resolve('../browser-main.js'), {
    cache: cache,
    packageCache: pkgCache,
    extensions: ['.jsx'],
    debug: true,
    fullPaths: true,
    basedir: path.dirname(path.resolve('../..'))
  })
    .transform(envify)
    .transform(babelify)
})

export default {
  'browser/main.js'() {
    console.time('bundle') // eslint-disable-line no-console
    const stream = main().bundle()
    stream.on('end', () => {
      console.timeEnd('bundle') // eslint-disable-line no-console
    })

    return stream
  }
}
