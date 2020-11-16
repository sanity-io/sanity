import observeFields from './observeFields'
import observeForPreview from './observeForPreview'
import observePaths from './observePaths'

export {observeForPreview, observePaths}

export const materializePaths = deprecate(
  observePaths,
  'The function materializePaths from @sanity/preview is deprecated in favor of observePaths from the same package'
)

export const observeWithPaths = deprecate(
  observeFields,
  'The function observeWithPaths from @sanity/preview is deprecated in favor of observePaths from the same package'
)

function deprecate(old: any, message: any, ...args: any[]) {
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
