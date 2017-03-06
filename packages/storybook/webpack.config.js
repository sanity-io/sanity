const sanityServer = require('@sanity/server')

module.exports = (storyWpConfig, configType) => {
  /* eslint-disable strict */

  'use strict'

  const sanityWpConfig = sanityServer.getWebpackBaseConfig({
    basePath: __dirname,
    commonChunkPlugin: false
  })

  sanityWpConfig.module = sanityWpConfig.module || {loaders: []}

  if (configType.toLowerCase() === 'development') {
    sanityWpConfig.module.loaders = sanityServer.applyStaticLoaderFix(sanityWpConfig, {
      httpHost: 'localhost',
      httpPort: 9001,
      staticPath: './static'
    })
  }

  return Object.assign({}, sanityWpConfig, storyWpConfig, {
    plugins: [].concat(storyWpConfig.plugins, sanityWpConfig.plugins || []),
    resolve: Object.assign({}, storyWpConfig.resolve, sanityWpConfig.resolve, {
      alias: Object.assign({}, storyWpConfig.resolve.alias || {}, sanityWpConfig.resolve.alias || {})
    }),
    module: Object.assign({}, storyWpConfig.module, sanityWpConfig.module, {
      loaders: [].concat(storyWpConfig.module.loaders, sanityWpConfig.module.loaders)
    })
  })
}
