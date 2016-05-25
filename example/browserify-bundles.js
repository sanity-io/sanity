import browserify from 'browserify'
import babelify from 'babelify'
import path from 'path'
import devnull from 'dev-null'
import rebundler from 'rebundler'
import envify from 'loose-envify'
import cssModulesify from 'css-modulesify'
import deferred from 'deferred-stream'

const main = rebundler((cache, pkgCache) => {
  const br = browserify(require.resolve('./browser-main.js'), {
    cache: cache,
    packageCache: pkgCache,
    extensions: ['.jsx'],
    debug: true,
    fullPaths: true,
    basedir: path.dirname(path.resolve('../..'))
  })
    .transform(envify)
    .transform(babelify)

  br.plugin(cssModulesify, {
    rootDir: path.join(__dirname, '..')
  })

  return br
})

export default {
  'stylesheets/modules.css'() {
    return deferred(str => {
      console.time('bundle css') // eslint-disable-line no-console
      const br = main()
      br.on('css stream', css => {
        css.on('end', () => {
          console.timeEnd('bundle css') // eslint-disable-line no-console
        })
        css.pipe(str)
      })
      br.bundle().pipe(devnull())
    })
  },
  'browser/main.js'() {
    console.time('bundle') // eslint-disable-line no-console
    const b = main()

    const stream = b.bundle()

    b.on('error', err => {
      stream.emit('error', err)
    })

    stream.on('end', () => {
      console.timeEnd('bundle') // eslint-disable-line no-console
    })

    return stream
  }
}
