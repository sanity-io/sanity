/* eslint-disable @typescript-eslint/no-var-requires */
/*
This file is here for the typescript-plugin-css-modules to pick up our postcss config
The plugin will look for postcss config it current working directory (cwd)
 */
const config = require('./packages/@sanity/server/src/configs/postcss.config')

module.exports = {
  ...config,
  // postcss-import is an async plugin and the typescript plugin currently does
  // not support async processing, so we need to remove it
  // see this issue: https://github.com/mrmckeb/typescript-plugin-css-modules/issues/46
  plugins: config.plugins.filter((plugin) => plugin.postcssPlugin !== 'postcss-import'),
}
