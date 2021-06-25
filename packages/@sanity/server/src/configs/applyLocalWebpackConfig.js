/* eslint-disable no-sync */
import fs from 'fs'
import path from 'path'
import {dynamicRequire} from '@sanity/util'

/**
 * NOTE: We do **NOT** encourage or suggest you extend the Sanity webpack config.
 *
 * It's very easy to break existing functionality like hot module reloading,
 * production build hashing, css module configuration, part resolution and so on.
 *
 * We're working towards making the bundling of Sanity studios more configurable,
 * but we're not quite there yet. Treat this as a _last resort_, and if you _do_
 * choose to go this route, remember that Sanity uses Webpack  ^3.8, so loaders,
 * plugins and such needs to be compatible with this version.
 */
export function applyLocalWebpackConfig(sanityWebpackConfig, basePath, mode) {
  const extPath = path.join(basePath, 'webpack.sanity.js')
  const hasExtensionFile = fs.existsSync(extPath)
  if (!hasExtensionFile) {
    return sanityWebpackConfig
  }

  let extender
  try {
    extender = dynamicRequire(extPath)
    if (typeof extender !== 'function') {
      throw new Error(`${extPath} did not export a function as default export`)
    }
  } catch (err) {
    console.error(
      'Failed to load custom webpack config file: %s. Using default webpack config.',
      err.message
    )
    return sanityWebpackConfig
  }

  try {
    const extendedConfig = extender(sanityWebpackConfig, {mode})
    if (
      extendedConfig &&
      typeof extendedConfig === 'object' &&
      typeof extendedConfig.module === 'object' &&
      Array.isArray(extendedConfig.module.rules)
    ) {
      return extendedConfig
    }

    console.error(
      'Invalid webpack config after extending Sanity config, did not include "module.rules" array. Using default webpack config.'
    )
    return sanityWebpackConfig
  } catch (err) {
    console.error(
      'Failed to extend Sanity webpack config:\n%s\n\nUsing default webpack config.',
      err.stack
    )
    return sanityWebpackConfig
  }
}
