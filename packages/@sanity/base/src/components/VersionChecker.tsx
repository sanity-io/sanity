import React from 'react'
import semverCompare from 'semver-compare'
import FullscreenMessageDialog from '../__legacy/@sanity/components/dialogs/FullscreenMessageDialog'
import {sanityModuleVersions} from '../legacyParts'
import {checkModuleStatus, useModuleStatus, VersionsResponse} from '../module-status'

/**
 * @note This _shouldn't_ be in use anywhere, but lets keep it around until we can be sure
 * @deprecated To be removed, please migrate away from this asap
 * @returns
 */
export default function DeprecatedVersionChecker() {
  const {value: result} = useModuleStatus()

  if (!result || result.isSupported || result.isSupported === undefined) {
    return null
  }

  return (
    <FullscreenMessageDialog color="danger" title="Unsupported module versions">
      <p>Modules are out of date</p>

      {result.helpUrl && (
        <p>
          For more information, please read <a href={result.helpUrl}>{result.helpUrl}</a>
        </p>
      )}
    </FullscreenMessageDialog>
  )
}

DeprecatedVersionChecker.checkVersions = (): Promise<VersionsResponse> => {
  console.warn('`VersionChecker.checkVersions()` is deprecated and marked for removal')
  return checkModuleStatus().toPromise()
}

/**
 * Gets the latest version of installed sanity packages, sorted by semver
 *
 * @deprecated To be removed, please migrate away from this asap
 */
DeprecatedVersionChecker.getLatestInstalled = (): string => {
  console.warn('`VersionChecker.getLatestInstalled()` is deprecated and marked for removal')

  const versionNums = Object.keys(sanityModuleVersions).map((pkg) => sanityModuleVersions[pkg])
  const sorted = versionNums.sort(semverCompare)
  return sorted[sorted.length - 1]
}
