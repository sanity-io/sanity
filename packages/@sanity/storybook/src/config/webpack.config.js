const webpack = require('webpack')
const sanityServer = require('@sanity/server')
const wpIntegration = require('@sanity/webpack-integration/v3')
const genDefaultConfig = require('@storybook/react/dist/server/config/defaults/webpack.config.js')

const skipCssLoader = rule => !rule.test || (rule.test && !rule.test.toString().includes('.css'))
const isCssLoader = rule => rule.test && rule.test.toString().includes('.css')
const isJsxLoader = rule => rule.test && rule.test.toString().includes('jsx')

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
  const context = Object.assign({}, sanityContext, {webpack})
  config.plugins = config.plugins.concat(wpIntegration.getPlugins(context))
  config.module.rules = (config.module.rules || []).concat(wpIntegration.getLoaders(context))
  config.module.rules = config.module.rules.filter(skipCssLoader)
  config.module.rules.unshift(sanityWpConfig.module.rules.find(isCssLoader))

  const jsonLoaderAt = config.module.rules.findIndex(rule =>
    (rule.loader || '').includes('json-loader')
  )

  const jsonHackLoader = {
    test: /\.json$/,
    resourceQuery: /sanityPart=/,
    loader: require.resolve('./jsonHackLoader.js')
  }

  if (jsonLoaderAt !== -1) {
    config.module.rules.splice(jsonLoaderAt + 1, 0, jsonHackLoader)
  }

  config.resolve = Object.assign({}, config.resolve, sanityWpConfig.resolve, {
    alias: Object.assign({}, config.resolve.alias || {}, sanityWpConfig.resolve.alias || {})
  })

  const storybookJsxLoader = config.module.rules.find(isJsxLoader)
  const sanityJsxLoader = sanityWpConfig.module.rules.find(isJsxLoader)

  if (storybookJsxLoader && sanityJsxLoader) {
    const jsxLoaderIndex = config.module.rules.indexOf(storybookJsxLoader)

    // replace with Sanity's JSX/TSX loader
    config.module.rules.splice(jsxLoaderIndex, 1, sanityJsxLoader)
  }

  return config
}

getWebpackConfig.setSanityContext = context => {
  sanityContext = context
}

module.exports = getWebpackConfig
