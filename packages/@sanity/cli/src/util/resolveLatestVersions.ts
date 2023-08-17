import latestVersion from 'get-latest-version'
import promiseProps from 'promise-props-recursive'

/**
 * Resolve the latest versions of given packages within their defined ranges
 *
 * @param pkgs - `{packageName: rangeOrTag}`
 * @returns Object of resolved version numbers
 */
export function resolveLatestVersions(
  pkgs: Record<string, string>,
): Promise<Record<string, string>> {
  const lookups: Record<string, Promise<string> | string> = {}
  for (const [packageName, range] of Object.entries(pkgs)) {
    lookups[packageName] =
      range === 'latest' ? latestVersion(packageName, {range}).then(caretify) : range
  }

  return promiseProps(lookups)
}

function caretify(version: string | undefined) {
  return version ? `^${version}` : 'latest'
}
