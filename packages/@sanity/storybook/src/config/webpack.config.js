const sanityServer = require('@sanity/server')

// todo: do something with this, according to https://storybook.js.org/configurations/custom-webpack-config/
const genDefaultConfig = require('@storybook/react/dist/server/config/defaults/webpack.config.js')

// This is very hacky, but I couldn't figure out a way to pass config from
// the parent task onto this configuration, which we need to infer the base
// path of the Sanity project in question, along with listener options et all.

// This only works because we never generate this configuration with different
// parameters within the same process, so handle with care, obviously.

let sanityContext = null

function getWebpackConfig(storyWpConfig, configType) {
  /* eslint-disable strict */

  'use strict'

  if (!sanityContext) {
    throw new Error('Sanity context has not been set for Storybook!')
  }

  const config = Object.assign({}, sanityContext, {commonChunkPlugin: false})
  const sanityWpConfig = sanityServer.getWebpackDevConfig(config)

  sanityWpConfig.module = sanityWpConfig.module || {loaders: []}

  if (configType.toLowerCase() === 'development') {
    sanityWpConfig.module.loaders = sanityServer.applyStaticLoaderFix(sanityWpConfig, config)
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

getWebpackConfig.setSanityContext = context => {
  sanityContext = context
}

module.exports = getWebpackConfig
