/**
 * Checks if a value looks like a video asset source from the Media Library.
 * Video assets use Global Document References with the format:
 * `media-library:{libraryId}:{assetInstanceId}`
 */
export function isVideoAssetSource(value: unknown): value is {asset: {_ref: string}} {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  const asset = obj.asset
  if (!asset || typeof asset !== 'object') return false
  const ref = (asset as Record<string, unknown>)._ref
  if (typeof ref !== 'string') return false
  return ref.startsWith('media-library:')
}
