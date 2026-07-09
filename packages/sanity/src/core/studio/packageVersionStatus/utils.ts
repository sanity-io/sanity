import semver from 'semver'

const MODULE_PATH_REGEX = /^\/v1\/modules\/sanity\/[^/]+\/[^/]+\/[^/]+\/?$/
// /v1/modules/by-app/some-appid-123/t1755876954/%5E4.5.0/sanity
const MODULE_PATH_REGEX_BY_APP = /^\/v1\/modules\/by-app\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/?$/

/**
 * Takes a module CDN URL (eg. read from an importmap and returns the min version range part of it)
 * @param moduleCdnUrl - a valid URL on the format https://example.com/v1/modules/sanity/default/%5E4.1.1/t1754072932
 */
export function parseImportMapModuleCdnUrl(
  moduleCdnUrl: string,
): {valid: true; appId?: string; minVersion: string} | {valid: false; error: Error} {
  const url = new URL(moduleCdnUrl, 'https://example.com')
  const rawParseResult = rawParseModuleCDNUrl(url)

  if (!rawParseResult.valid) {
    return rawParseResult
  }

  const {appId, version: rawVersion} = rawParseResult
  const minVersion = decodeURIComponent(rawVersion)

  if (!semver.validRange(minVersion)) {
    return {
      valid: false,
      error: new Error(`Invalid minVersion "${minVersion}" in module cdn url: ${moduleCdnUrl}`),
    }
  }

  return {
    valid: true,
    appId,
    minVersion,
  }
}

function rawParseModuleCDNUrl(
  url: URL,
): {valid: true; appId?: string; version: string} | {valid: false; error: Error} {
  if (MODULE_PATH_REGEX_BY_APP.test(url.pathname)) {
    // prettier-ignore
    // eg /v1/modules/by-app/iwyfhbjad8dipooo6r1r28vs/t1755874170/%5E4.5.0/sanity
    const [, /*v1*/, /*modules*/, /*by-app*/, appId, /*timestamp*/, encodedVersion] = url.pathname.split('/')
    return {
      valid: true,
      appId,
      version: encodedVersion,
    }
  }

  if (MODULE_PATH_REGEX.test(url.pathname)) {
    // prettier-ignore
    // eg /v1/modules/sanity/default/%5E4.1.1/t1754072932
    const [, /*v1*/, /*modules*/, /*sanity*/, /*default*/, encodedVersion] = url.pathname.split('/')

    return {valid: true, appId: undefined, version: encodedVersion}
  }
  return {
    valid: false,
    error: new Error(`Unable to parse module CDN URL: ${url.pathname}`),
  }
}
