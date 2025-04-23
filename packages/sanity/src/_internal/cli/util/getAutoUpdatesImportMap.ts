/**
 * @internal
 */
export interface StudioAutoUpdatesImportMap {
  'sanity': string
  'sanity/': string
  '@sanity/vision': string
  '@sanity/vision/': string
}

const MODULES_HOST =
  process.env.SANITY_INTERNAL_ENV === 'staging'
    ? 'https://sanity-cdn.work'
    : 'https://sanity-cdn.com'

/**
 * @internal
 */
export function getStudioAutoUpdateImportMap(version: string): StudioAutoUpdatesImportMap {
  const timestamp = `t${Math.floor(Date.now() / 1000)}`

  const autoUpdatesImports = {
    'sanity': `${MODULES_HOST}/v1/modules/sanity/default/${version}/${timestamp}`,
    'sanity/': `${MODULES_HOST}/v1/modules/sanity/default/${version}/${timestamp}/`,
    '@sanity/vision': `${MODULES_HOST}/v1/modules/@sanity__vision/default/${version}/${timestamp}`,
    '@sanity/vision/': `${MODULES_HOST}/v1/modules/@sanity__vision/default/${version}/${timestamp}/`,
  }

  return autoUpdatesImports
}
