import {Dialog} from '@sanity/ui'
import React from 'react'
import semverCompare from 'semver-compare'
import {
  checkModuleStatus,
  CheckModuleVersionsOptions,
  useModuleStatus,
  VersionsResponse,
} from '../module-status'
import {useSource} from '../studio'

/**
 * @note This _shouldn't_ be in use anywhere, but lets keep it around until we can be sure
 * @deprecated To be removed, please migrate away from this asap
 * @returns
 */
export function DeprecatedVersionChecker() {
  const {client} = useSource()
  const {value: result} = useModuleStatus({client})

  if (!result || result.isSupported || result.isSupported === undefined) {
    return null
  }

  return (
    <Dialog header="Unsupported module versions" id="version-checker-dialog">
      <p>Modules are out of date</p>

      {result.helpUrl && (
        <p>
          For more information, please read <a href={result.helpUrl}>{result.helpUrl}</a>
        </p>
      )}
    </Dialog>
  )
}

DeprecatedVersionChecker.checkVersions = (
  options: CheckModuleVersionsOptions
): Promise<VersionsResponse> => {
  console.warn('`VersionChecker.checkVersions()` is deprecated and marked for removal')
  return checkModuleStatus(options).toPromise()
}

/**
 * Gets the latest version of installed sanity packages, sorted by semver
 *
 * @deprecated To be removed, please migrate away from this asap
 */
DeprecatedVersionChecker.getLatestInstalled = (): string => {
  console.warn('`VersionChecker.getLatestInstalled()` is deprecated and marked for removal')

  // @todo
  // const versionNums = Object.keys(sanityModuleVersions).map((pkg) => sanityModuleVersions[pkg])
  const versionNums: string[] = []
  const sorted = versionNums.sort(semverCompare)
  return sorted[sorted.length - 1]
}
