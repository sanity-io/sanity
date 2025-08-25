import semver from 'semver'

const MODULE_PATH_REGEX = /^\/v1\/modules\/sanity\/[^/]+\/[^/]+\/[^/]+\/?$/
// /v1/modules/by-app/some-appid-123/t1755876954/%5E4.5.0/sanity
const MODULE_PATH_REGEX_BY_APP = /^\/v1\/modules\/by-app\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/?$/

/**
 * Takes a module cdn URL (eg. read from an importmap and returns the semver range part of it)
 * @param moduleCDNUrl - a valid URL on the format https://example.com/v1/modules/sanity/default/%5E4.1.1/t1754072932
 */
export function getBaseVersionFromModuleCDNUrl(moduleCDNUrl: string) {
  const url = new URL(moduleCDNUrl, 'https://example.com')

  if (MODULE_PATH_REGEX_BY_APP.test(url.pathname)) {
    // prettier-ignore
    // eg /v1/modules/by-app/iwyfhbjad8dipooo6r1r28vs/t1755874170/%5E4.5.0/sanity
    const [, /*v1*/, /*modules*/, /*by-app*/, /*appid*/, /*timestamp*/, encodedVersion] = url.pathname.split('/')

    const decoded = decodeURIComponent(encodedVersion)
    return semver.validRange(decoded) ? decoded : undefined
  }

  if (MODULE_PATH_REGEX.test(url.pathname)) {
    // prettier-ignore
    // eg /v1/modules/sanity/default/%5E4.1.1/t1754072932
    const [, /*v1*/, /*modules*/, /*sanity*/, /*default*/, encodedVersion] = url.pathname.split('/')

    const decoded = decodeURIComponent(encodedVersion)
    return semver.validRange(decoded) ? decoded : undefined
  }

  console.warn(
    new Error(
      'Unable to extract base version from import map, auto updates may not work as expected',
    ),
  )
  return undefined
}
