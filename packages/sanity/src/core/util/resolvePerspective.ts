/**
 * If the provided perspective has the `bundle.` prefix, returns it with this
 * prefix removed.
 *
 * @internal
 */
export function resolveBundlePerspective(perspective?: string): string | undefined {
  return perspective?.split(/^bundle./).at(1)
}

// TODO: Improve handling of this scenario.
const MAXIMUM_SUPPORTED_BUNDLE_PERSPECTIVES = 10

/**
 * Given a system perspective, or a bundle name prefixed with `bundle.`, returns
 * an object with a `bundlePerspective` property that may be submitted directly
 * to Content Lake APIs.
 *
 * @internal
 */
export function resolvePerspectiveOptions(
  perspective: string[] | undefined,
): {bundlePerspective: string} | Record<PropertyKey, never> {
  if (typeof perspective === 'undefined') {
    return {}
  }

  return {
    // TODO: The slice operation is to ensure we don't send an invalid request to Content Lake.
    //       In production, it shouldn't be possible for a project to exceed this quantity of
    //       releases in the first place. We should improve handling of this scenario and remove
    //       the slice operation to avoid unexpected behaviour.
    bundlePerspective: perspective.slice(0, MAXIMUM_SUPPORTED_BUNDLE_PERSPECTIVES - 1).join(','),
  }
}
