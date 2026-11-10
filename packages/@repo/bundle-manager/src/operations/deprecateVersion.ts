import {type DeprecatedDict, type ManifestPackage, type Semver} from '../types'

export function isDeprecated(deprecated: DeprecatedDict | undefined, version: Semver): boolean {
  return Boolean(deprecated?.[version])
}

/**
 * Marks a version as deprecated. The version stays in `versions` and in any tag lists; only the
 * `deprecated` map is updated.
 */
export function deprecateVersion(
  manifestPackage: ManifestPackage,
  entry: {version: Semver; timestamp: number; reason?: string},
): ManifestPackage {
  const {version, timestamp, reason} = entry
  const targetVersionExists = manifestPackage.versions.some((v) => v.version === version)
  if (!targetVersionExists) {
    throw new Error(`Version "${version}" not known`)
  }

  return {
    ...manifestPackage,
    deprecated: {
      ...manifestPackage.deprecated,
      [version]: reason ? {timestamp, reason} : {timestamp},
    },
  }
}

/**
 * Removes a deprecation notice again. The `deprecated` map is kept (possibly empty) once it
 * exists, so consumers can tell "nothing deprecated" from "no deprecation info".
 */
export function undeprecateVersion(
  manifestPackage: ManifestPackage,
  version: Semver,
): ManifestPackage {
  if (!isDeprecated(manifestPackage.deprecated, version)) {
    throw new Error(`Version "${version}" is not deprecated`)
  }
  const {[version]: _removed, ...remaining} = manifestPackage.deprecated!
  return {...manifestPackage, deprecated: remaining}
}
