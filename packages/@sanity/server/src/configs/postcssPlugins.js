import webpackIntegration from '@sanity/webpack-integration/v3'

export default (options) => {
  return webpackIntegration.getPostcssPlugins(options)
}
