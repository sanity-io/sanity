import {type AssetSource} from '@sanity/types'
import startCase from 'lodash-es/startCase.js'

/**
 * Check if an asset source supports uploads (either picker mode with Uploader or component mode).
 *
 * @internal
 */
export function hasUploadSupport(source: AssetSource): boolean {
  return Boolean(source.Uploader) || source.uploadMode === 'component'
}

/**
 * Check if an asset source uses component mode for uploads.
 *
 * @internal
 */
export function isComponentModeAssetSource(source: AssetSource): boolean {
  return source.uploadMode === 'component'
}

/**
 * Filter asset sources that support uploads (either picker mode with Uploader or component mode).
 *
 * @internal
 */
export function getAssetSourcesWithUpload(sources: AssetSource[]): AssetSource[] {
  return sources.filter(hasUploadSupport)
}

/**
 * Get the display name for an asset source.
 * Uses i18n translation if available, falls back to title, then to name (optionally with startCase).
 *
 * @internal
 */
export function getAssetSourceDisplayName(
  source: AssetSource,
  t: (key: string) => string,
  options?: {useStartCaseForName?: boolean},
): string {
  const base = source.i18nKey ? t(source.i18nKey) : source.title
  if (base) return base
  return options?.useStartCaseForName ? startCase(source.name) : source.name
}
