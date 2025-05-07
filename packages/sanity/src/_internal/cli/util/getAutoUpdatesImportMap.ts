/**
 * @internal
 */
export interface StudioAutoUpdatesImportMap {
  'sanity': string
  'sanity/': string
  '@sanity/vision'?: string
  '@sanity/vision/'?: string
}

export interface SanityAppAutoUpdatesImportMap extends Partial<StudioAutoUpdatesImportMap> {
  '@sanity/sdk': string
  '@sanity/sdk/': string
  '@sanity/sdk-react': string
  '@sanity/sdk-react/': string
}

const MODULES_HOST =
  process.env.SANITY_INTERNAL_ENV === 'staging'
    ? 'https://sanity-cdn.work'
    : 'https://sanity-cdn.com'

function getTimestamp(): string {
  return `t${Math.floor(Date.now() / 1000)}`
}

/**
 * @internal
 */
export function getStudioAutoUpdateImportMap(
  version: string,
  includeVision = true,
): StudioAutoUpdatesImportMap {
  const timestamp = getTimestamp()

  const autoUpdatesImports = {
    'sanity': `${MODULES_HOST}/v1/modules/sanity/default/${version}/${timestamp}`,
    'sanity/': `${MODULES_HOST}/v1/modules/sanity/default/${version}/${timestamp}/`,
  }

  if (includeVision) {
    return {
      ...autoUpdatesImports,
      '@sanity/vision': `${MODULES_HOST}/v1/modules/@sanity__vision/default/${version}/${timestamp}`,
      '@sanity/vision/': `${MODULES_HOST}/v1/modules/@sanity__vision/default/${version}/${timestamp}/`,
    }
  }

  return autoUpdatesImports
}

interface GetAppAutoUpdateImportMapOptions {
  sdkVersion: string
  sanityVersion?: string
}

/**
 * @internal
 */
export function getAppAutoUpdateImportMap(
  options: GetAppAutoUpdateImportMapOptions,
): SanityAppAutoUpdatesImportMap {
  const timestamp = getTimestamp()

  const {sdkVersion, sanityVersion} = options

  const autoUpdatesImports: SanityAppAutoUpdatesImportMap = {
    '@sanity/sdk': `${MODULES_HOST}/v1/modules/@sanity__sdk/default/${sdkVersion}/${timestamp}`,
    '@sanity/sdk/': `${MODULES_HOST}/v1/modules/@sanity__sdk/default/${sdkVersion}/${timestamp}/`,
    '@sanity/sdk-react': `${MODULES_HOST}/v1/modules/@sanity__sdk-react/default/${sdkVersion}/${timestamp}`,
    '@sanity/sdk-react/': `${MODULES_HOST}/v1/modules/@sanity__sdk-react/default/${sdkVersion}/${timestamp}/`,
  }

  if (sanityVersion) {
    const sanityImportMap = getStudioAutoUpdateImportMap(sanityVersion, false)
    return {...autoUpdatesImports, ...sanityImportMap}
  }

  return autoUpdatesImports
}
