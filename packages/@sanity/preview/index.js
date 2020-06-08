/* eslint-disable @typescript-eslint/no-var-requires */
exports.observeForPreview = require('./lib/observeForPreview').default
exports.observePaths = require('./lib/observePaths').default

exports.materializePaths = deprecate(
  exports.observePaths,
  'The function materializePaths from @sanity/preview is deprecated in favor of observePaths from the same package'
)

exports.observeWithPaths = deprecate(
  require('./lib/observeFields').default,
  'The function observeWithPaths from @sanity/preview is deprecated in favor of observePaths from the same package'
)

function deprecate(old, message) {
  let hasWarned = false
  return function deprecated() {
    if (!hasWarned) {
      hasWarned = true
      // eslint-disable-next-line no-console
      console.warn(new Error(message))
    }
    // eslint-disable-next-line prefer-rest-params
    return old(...arguments)
  }
}
