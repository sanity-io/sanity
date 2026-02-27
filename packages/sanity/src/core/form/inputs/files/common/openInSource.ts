import {type Asset, type AssetSource} from '@sanity/types'

/**
 * Result of finding an asset source that can open the asset in its source.
 */
export type OpenInSourceResult = {
  source: AssetSource
  result: {type: 'url'; url: string; target?: '_blank' | '_self'} | {type: 'component'}
} | null

/**
 * Find the first asset source that can handle opening the given asset in its source.
 * Returns null if no asset source can handle this asset.
 */
export function findOpenInSourceResult(
  asset: Asset,
  assetSources: AssetSource[],
): OpenInSourceResult {
  if (!asset?.source) return null

  for (const assetSource of assetSources) {
    if (!assetSource.openInSource) continue

    const result = assetSource.openInSource(asset)
    if (result && typeof result === 'object') {
      return {source: assetSource, result}
    }
  }
  return null
}

/**
 * Get the display name for an asset source from an OpenInSourceResult.
 * Uses i18n translation if available, falls back to title, then to name.
 *
 * @param openInSourceResult - The result from findOpenInSourceResult
 * @param t - Translation function from useTranslation()
 * @returns The display name, or undefined if openInSourceResult is null
 */
export function getOpenInSourceName(
  openInSourceResult: OpenInSourceResult,
  t: (key: string) => string,
): string | undefined {
  if (!openInSourceResult) return undefined

  const {source} = openInSourceResult
  return (source.i18nKey ? t(source.i18nKey) : source.title) || source.name
}
