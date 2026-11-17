import {type PartialIndexFieldPaths} from './types'

function toSegments(path: string): string[] {
  return path.replaceAll('[]', '.[]').split('.').filter(Boolean)
}

function matchingPrefixLength(paths: readonly string[] | undefined, pathSegments: string[]) {
  let longest = 0
  for (const candidate of paths ?? []) {
    const segments = toSegments(candidate)
    if (
      segments.length > longest &&
      segments.length <= pathSegments.length &&
      segments.every((segment, index) => segment === pathSegments[index])
    ) {
      longest = segments.length
    }
  }
  return longest
}

/**
 * Whether a search path (e.g. `analytics.pageName`, `items[].title`) lies inside a subtree that the
 * dataset's partial index excludes.
 *
 * An excluded path covers itself and everything below it, including array items, so `analytics`
 * excludes `analytics.pageName` and `analytics[].pageName`. An included path only takes precedence
 * when it is more specific than the exclusion that covers the search path. When the two are equally
 * specific the path is treated as excluded, since boosting an unindexed field makes `score()`
 * reject the whole query, while skipping a boost only affects ranking.
 *
 * @internal
 */
export function isFieldPathExcludedFromIndex(
  path: string,
  {excludeFieldPaths, includeFieldPaths}: PartialIndexFieldPaths,
): boolean {
  if (!excludeFieldPaths?.length) return false

  const pathSegments = toSegments(path)
  const excluded = matchingPrefixLength(excludeFieldPaths, pathSegments)
  if (excluded === 0) return false

  return excluded >= matchingPrefixLength(includeFieldPaths, pathSegments)
}
