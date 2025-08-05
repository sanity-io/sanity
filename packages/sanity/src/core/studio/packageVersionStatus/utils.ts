import semver from 'semver'

const MODULE_PATH_REGEX = /^\/v1\/modules\/sanity\/[^/]+\/[^/]+\/[^/]+\/?$/

/**
 * Takes a module cdn URL (eg. read from an importmap and returns the semver range part of it)
 * @param moduleCDNUrl - a valid URL on the format https://example.com/v1/modules/sanity/default/%5E4.1.1/t1754072932
 */
export function getBaseVersionFromModuleCDNUrl(moduleCDNUrl: string) {
  const url = new URL(moduleCDNUrl, 'https://example.com')

  if (!MODULE_PATH_REGEX.test(url.pathname)) {
    console.warn(
      new Error(
        'Unable to extract base version from import map, auto updates may not work as expected',
      ),
    )
    return undefined
  }
  // prettier-ignore
  // eg /v1/modules/sanity/default/%5E4.1.1/t1754072932
  const [, /*v1*/, /*modules*/, /*sanity*/, /*default*/, encodedVersion] = url.pathname.split('/')

  const decoded = decodeURIComponent(encodedVersion)
  return semver.validRange(decoded) ? decoded : undefined
}
