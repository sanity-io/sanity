import {type APIConfig} from '@sanity/migrate'

type ApiVersion = APIConfig['apiVersion']

/**
 * Ensures that the provided API version string is in the correct format.
 * If the version does not start with 'v', it will be prefixed with 'v'.
 * If the version does not match the expected pattern, an error will be thrown.
 */
export function ensureApiVersion(version: string): ApiVersion {
  const normalizedVersion = version.startsWith('v') ? version : `v${version}`

  // Check if the version matches the expected pattern
  const versionPattern = /^v\d+-\d+-\d+$|^vX$/
  if (!versionPattern.test(normalizedVersion)) {
    throw new Error(
      `Invalid API version format: ${normalizedVersion}. Expected format: v1-2-3 or vX`,
    )
  }

  return normalizedVersion as ApiVersion
}
