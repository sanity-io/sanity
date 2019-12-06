/* eslint-disable no-process-env */
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const postcssImport = require('postcss-import')
const postcssCssnext = require('postcss-cssnext')
const PartResolverPlugin = require('@sanity/webpack-loader')
const resolveStyleImport = require('./resolveStyleImport')

const partLoaderPath = require.resolve('@sanity/webpack-loader/lib/partLoader')

function getPartResolverPlugin(options) {
  return new PartResolverPlugin(options)
}

function tryReadDotEnv(studioRootPath, configEnv) {
  const envFile = path.join(studioRootPath, `.env.${configEnv}`)

  let parsed = {}
  try {
    // eslint-disable-next-line no-sync
    parsed = dotenv.parse(fs.readFileSync(envFile, {encoding: 'utf8'}))
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.error(`There was a problem processing the .env file (${envFile})`, err)
    }
  }

  return parsed
}

function getSanityEnvVars({env, basePath}) {
  const configEnv = process.env.SANITY_ACTIVE_ENV || env || 'development'
  const dotEnvVars = tryReadDotEnv(basePath, configEnv)
  const allEnvVars = {...dotEnvVars, ...process.env}
  return Object.keys(allEnvVars).reduce((acc, key) => {
    if (key.startsWith('SANITY_STUDIO_')) {
      acc[key] = allEnvVars[key]
    }
    return acc
  }, {})
}

function getEnvVars({isProd, env, basePath}) {
  const envVars = getSanityEnvVars({env, basePath})

  return Object.keys(envVars).reduce(
    (acc, key) => {
      acc[`process.env.${key}`] = JSON.stringify(envVars[key])
      return acc
    },
    {
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      'process.env': JSON.stringify({})
    }
  )
}

function getEnvPlugin(options) {
  const bundleEnv = options.bundleEnv || process.env.BUNDLE_ENV || 'development'
  const env = options.env || 'development'
  const isProd = env === 'production'
  const webpack = options.webpack || require('webpack')
  return new webpack.DefinePlugin({
    __DEV__: !isProd && bundleEnv === 'development',
    ...getEnvVars({isProd, env, basePath: options.basePath})
  })
}

function getPlugins(options) {
  return [getPartResolverPlugin(options), getEnvPlugin(options)]
}

function getPartLoader(options) {
  return {
    resourceQuery: /[?&]sanityPart=/,
    use: partLoaderPath
  }
}

function getLoaders(options) {
  return [getPartLoader(options)]
}

function getStyleResolver(options) {
  return resolveStyleImport({from: options.basePath})
}

function getPostcssImportPlugin(options) {
  const styleResolver = getStyleResolver(options)
  const importer = postcssImport({resolve: styleResolver})
  return importer
}

function getPostcssPlugins(options) {
  const importer = getPostcssImportPlugin(options)
  const nextOpts = options.cssnext
  return [importer, postcssCssnext(nextOpts)]
}

function getConfig(options) {
  return {
    plugins: getPlugins(options),
    loaders: getLoaders(options),
    postcss: () => ({
      plugins: getPostcssPlugins(options)
    })
  }
}

module.exports = {
  getPlugins: getPlugins,
  getLoaders: getLoaders,
  getEnvPlugin: getEnvPlugin,
  getPartLoader: getPartLoader,
  getStyleResolver: getStyleResolver,
  getSanityEnvVars: getSanityEnvVars,
  getPartResolverPlugin: getPartResolverPlugin,
  getPostcssImportPlugin: getPostcssImportPlugin,
  getPostcssPlugins: getPostcssPlugins,
  getConfig: getConfig
}
