import {type Reference} from '@sanity/types'

import {parseMediaLibraryReference} from '../VideoInput/parseMediaLibraryReference'

export interface VideoAssetSource {
  _type: 'sanity.video'
  asset: {
    _type: 'globalDocumentReference'
    _ref: string
  }
}

export interface ParsedVideoAssetSource {
  mediaLibraryId: string
  assetRef: Reference
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Parses a normalized video value backed by a pinned Media Library video instance.
 */
export function parseVideoAssetSource(value: unknown): ParsedVideoAssetSource | null {
  if (!isRecord(value) || value._type !== 'sanity.video') return null

  const asset = value.asset
  if (!isRecord(asset) || asset._type !== 'globalDocumentReference') return null

  const ref = asset._ref
  if (typeof ref !== 'string') return null

  const parsed = parseMediaLibraryReference(ref)
  if (!parsed) return null

  return {
    mediaLibraryId: parsed.mediaLibraryId,
    assetRef: {_type: 'globalDocumentReference', _ref: ref},
  }
}

export function isVideoAssetSource(value: unknown): value is VideoAssetSource {
  return parseVideoAssetSource(value) !== null
}
