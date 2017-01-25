const path = require('path')
const sanityServer = require('@sanity/server')

module.exports = (storyWpConfig, configType) => {
  'use strict' // eslint-disable-line strict

  const sanityWpConfig = sanityServer.getWebpackBaseConfig({
    basePath: __dirname,
    commonChunkPlugin: false
  })

  sanityWpConfig.module = sanityWpConfig.module || {loaders: []}

  if (configType === 'DEVELOPMENT') {
    sanityWpConfig.module.loaders = sanityServer.applyStaticLoaderFix(sanityWpConfig, {
      listen: {
        hostname: 'localhost',
        port: 9001,
        staticPath: './static'
      }
    })
  }

  return Object.assign({}, sanityWpConfig, storyWpConfig, {
    plugins: [].concat(storyWpConfig.plugins, sanityWpConfig.plugins || []),
    module: Object.assign({}, storyWpConfig.module, sanityWpConfig.module, {
      loaders: [].concat(storyWpConfig.module.loaders, sanityWpConfig.module.loaders)
    })
  })
}
