import {type ReleaseDescriptionInfo} from '../__telemetry__/releases.telemetry'

const URL_PATTERN = /(https?:\/\/|www\.)/i

/**
 * Derives low-cardinality, privacy-preserving telemetry about a release
 * description. The description content is never included in the result - only
 * the action (set at creation vs edited), its character count, and whether it
 * contains a URL.
 */
export function getReleaseDescriptionTelemetry(
  action: ReleaseDescriptionInfo['action'],
  description?: string,
): ReleaseDescriptionInfo {
  const value = description ?? ''

  return {
    action,
    characterCount: value.length,
    containsUrl: URL_PATTERN.test(value),
  }
}
