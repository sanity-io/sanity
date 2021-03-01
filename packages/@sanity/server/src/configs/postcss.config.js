const resolveProjectRoot = require('@sanity/resolver').resolveProjectRoot
const webpackIntegration = require('@sanity/webpack-integration/v3')
const isSanityMonorepo = require('./isSanityMonorepo')

const basePath = resolveProjectRoot({sync: true})

module.exports = {
  plugins: webpackIntegration.getPostcssPlugins({
    basePath,
    isSanityMonorepo: isSanityMonorepo(basePath),
    cssnext: {
      features: {
        customProperties: true,
      },
    },
  }),
}
