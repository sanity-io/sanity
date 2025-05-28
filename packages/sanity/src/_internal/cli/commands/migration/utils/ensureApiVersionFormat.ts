import {type APIConfig} from '@sanity/migrate'

type ApiVersion = APIConfig['apiVersion']

const VERSION_PATTERN = /^v\d+-\d+-\d+$|^vX$/ // Matches version strings like vYYYY-MM-DD or vX

/**
 * Ensures that the provided API version string is in the correct format.
 * If the version does not start with 'v', it will be prefixed with 'v'.
 * If the version does not match the expected pattern, an error will be thrown.
 */
export function ensureApiVersionFormat(version: string): ApiVersion {
  const normalizedVersion = version.startsWith('v') ? version : `v${version}`

  // Check if the version matches the expected pattern
  if (!VERSION_PATTERN.test(normalizedVersion)) {
    throw new Error(
      `Invalid API version format: ${normalizedVersion}. Expected format: vYYYY-MM-DD or vX`,
    )
  }

  return normalizedVersion as ApiVersion
}
