/**
 * @internal
 */
export interface AutoUpdatesImportMap {
  'sanity': string
  'sanity/': string
  '@sanity/vision': string
  '@sanity/vision/': string
}

const MODULES_HOST = 'https://sanity-cdn.work'

/**
 * @internal
 */
export function getAutoUpdateImportMap(version: string): AutoUpdatesImportMap {
  const autoUpdatesImports = {
    'sanity': `${MODULES_HOST}/v1/modules/sanity/default/${version}`,
    'sanity/': `${MODULES_HOST}/v1/modules/sanity/default/${version}/`,
    '@sanity/vision': `${MODULES_HOST}/v1/modules/@sanity__vision/default/${version}`,
    '@sanity/vision/': `${MODULES_HOST}/v1/modules/@sanity__vision/default/${version}/`,
  }

  return autoUpdatesImports
}
