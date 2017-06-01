import webpackIntegration from '@sanity/webpack-integration'

export default options => {
  return wp => {
    return webpackIntegration.getPostcssPlugins(options)
  }
}
