/**
 * If the provided perspective has the `release.` prefix, returns it with this
 * prefix removed.
 *
 * @internal
 */
export function resolveBundlePerspective(perspective?: string): string | undefined {
  return perspective?.split(/^bundle./).at(1)
}

/**
 * Given a system perspective, or a bundle name prefixed with `bundle.`, returns
 * an object with either `perspective` or `bundlePerspective` properties that
 * may be submitted directly to Content Lake APIs.
 *
 * @internal
 */
export function resolvePerspectiveOptions(
  perspective: string | undefined,
  transformPerspectives: (perspectives: string[], isSystemPerspective: boolean) => string[] = (
    perspectives,
  ) => perspectives,
):
  | {perspective: string; bundlePerspective?: never}
  | {perspective?: never; bundlePerspective: string}
  | Record<PropertyKey, never> {
  if (typeof perspective === 'undefined') {
    return {}
  }

  const bundlePerspective = resolveBundlePerspective(perspective)

  if (typeof bundlePerspective === 'string') {
    return {
      bundlePerspective: transformPerspectives([bundlePerspective], false).join(','),
    }
  }

  return {
    perspective: transformPerspectives([perspective], true).join(','),
  }
}
