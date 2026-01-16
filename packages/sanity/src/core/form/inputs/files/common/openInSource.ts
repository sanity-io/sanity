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
