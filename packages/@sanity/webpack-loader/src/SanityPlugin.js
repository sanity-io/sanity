import path from 'path'

const cssQs = '?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
const roleMatcher = /(?:^|!)+style:(.*?)$/

function SanityPlugin(opts) {
  this.options = opts || {}

  if (!this.options.loaderPath) {
    throw new Error('`loaderPath` option must be set')
  }

  if (!this.options.basePath) {
    throw new Error('`basePath` option must be set')
  }
}

SanityPlugin.prototype.apply = function (compiler) {
  compiler.resolvers.normal.plugin('module', (data, callback) => {
    if (data.request.indexOf('style:') !== 0) {
      return callback()
    }

    const qs = `?style=${data.request.substring('style:'.length)}`
    return callback(null, Object.assign({}, data, {
      path: require.resolve('./styleLoader') + qs,
      resolved: true
    }))
  })

  compiler.plugin('normal-module-factory', nmf => {
    nmf.plugin('after-resolve', (data, callback) => {
      const match = data.rawRequest.match(roleMatcher)
      const role = match && match[1]

      if (!role) {
        return callback(null, data)
      }

      const loaderPath = this.options.loaderPath
      const basePath = this.options.basePath
      const styleQs = `?style=${role}&basePath=${basePath}`
      data.loaders = [
        path.join(loaderPath, 'style-loader'),
        path.join(loaderPath, 'css-loader') + cssQs,
        path.join(loaderPath, 'postcss-loader'),
        require.resolve('./styleLoader') + styleQs
      ]

      return callback(null, data)
    })
  })
}

module.exports = SanityPlugin
