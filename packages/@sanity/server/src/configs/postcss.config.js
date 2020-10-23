const resolveProjectRoot = require('@sanity/resolver').resolveProjectRoot
const webpackIntegration = require('@sanity/webpack-integration/v3')

module.exports = {
  plugins: webpackIntegration.getPostcssPlugins({
    basePath: resolveProjectRoot({sync: true}),
    cssnext: {
      features: {
        customProperties: true,
      },
    },
  }),
}
