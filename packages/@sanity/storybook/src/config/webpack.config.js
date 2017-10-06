const sanityServer = require('@sanity/server')
const wpIntegration = require('@sanity/webpack-integration/v3')
const genDefaultConfig = require('@storybook/react/dist/server/config/defaults/webpack.config.js')

const skipCssLoader = rule => !rule.test || (rule.test && !rule.test.toString().includes('.css'))
const isCssLoader = rule => rule.test && rule.test.toString().includes('.css')

// This is very hacky, but I couldn't figure out a way to pass config from
// the parent task onto this configuration, which we need to infer the base
// path of the Sanity project in question, along with listener options et all.

// This only works because we never generate this configuration with different
// parameters within the same process, so handle with care, obviously.

let sanityContext = null

function getWebpackConfig(baseConfig, env) {
  /* eslint-disable strict */

  'use strict'

  if (!sanityContext) {
    throw new Error('Sanity context has not been set for Storybook!')
  }

  const wpConfig = Object.assign({}, sanityContext, {commonChunkPlugin: false})
  const sanityWpConfig = sanityServer.getWebpackDevConfig(wpConfig)
  const config = Object.assign({}, genDefaultConfig(baseConfig, env))
  config.plugins = config.plugins.concat(wpIntegration.getPlugins(sanityContext))
  config.module.rules = (config.module.rules || []).concat(wpIntegration.getLoaders(sanityContext))
  config.module.rules = config.module.rules.filter(skipCssLoader)
  config.module.rules.unshift(sanityWpConfig.module.rules.find(isCssLoader))

  config.resolve = Object.assign({}, config.resolve, sanityWpConfig.resolve, {
    alias: Object.assign(
      {},
      config.resolve.alias || {},
      sanityWpConfig.resolve.alias || {}
    )
  })
  return config
}

getWebpackConfig.setSanityContext = context => {
  sanityContext = context
}

module.exports = getWebpackConfig
