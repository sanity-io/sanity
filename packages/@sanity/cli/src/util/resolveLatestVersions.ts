import latestVersion from 'get-latest-version'
import promiseProps from 'promise-props-recursive'

export function resolveLatestVersions(
  pkgs: string[],
  {asRange}: {asRange: boolean}
): Promise<Record<string, string>> {
  return promiseProps(
    pkgs.reduce((versions, pkg) => {
      versions[pkg] = latestVersion(pkg).then(asRange ? caretify : identity)
      return versions
    }, {} as Record<string, Promise<string>>)
  )
}

function caretify(version: string) {
  return `^${version}`
}

function identity(version: string) {
  return version
}
