import {type CustomValidator, type ValidationContext} from '@sanity/types'

import {validationMarkerCodes} from '../codes'

const DEFAULT_API_VERSION = '2025-02-19'

const ASSET_FILE_TYPE_QUERY = `*[_id == $id][0]{mimeType, extension}`

const EXTENSION_ALIASES: Record<string, string> = {jpeg: 'jpg', tif: 'tiff'}

type AssetFileType = {mimeType?: string; extension?: string}

export type AcceptedAssetType = 'image' | 'file'

// Asset ids are content hashes, so a resolved file type never changes for a given id.
const resolvedFileTypes = new Map<string, AssetFileType>()

function normalizeExtension(extension: string): string {
  const lowerCased = extension.toLowerCase()
  return EXTENSION_ALIASES[lowerCased] ?? lowerCased
}

function matchesAcceptToken(
  {mimeType = '', extension = ''}: AssetFileType,
  token: string,
): boolean {
  if (token === '*' || token === '*/*') return true
  if (token.startsWith('.')) {
    return normalizeExtension(token.slice(1)) === normalizeExtension(extension)
  }
  if (token.endsWith('/*')) return mimeType.toLowerCase().startsWith(token.slice(0, -1))
  return mimeType.toLowerCase() === token
}

/**
 * Checks a stored asset against an HTML `accept` string, matching how uploads are checked.
 *
 * @internal
 */
export function assetMatchesAccept(fileType: AssetFileType, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
  return tokens.length === 0 || tokens.some((token) => matchesAcceptToken(fileType, token))
}

function getAssetId(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'asset' in value) {
    const {asset} = value
    if (typeof asset === 'object' && asset !== null && '_ref' in asset) {
      return typeof asset._ref === 'string' ? asset._ref : undefined
    }
  }
  return undefined
}

async function fetchAssetFileType(
  assetId: string,
  context: ValidationContext,
): Promise<AssetFileType | null> {
  const cached = resolvedFileTypes.get(assetId)
  if (cached) return cached

  const fileType = await context
    .getClient({apiVersion: DEFAULT_API_VERSION})
    .fetch<AssetFileType | null>(
      ASSET_FILE_TYPE_QUERY,
      {id: assetId},
      {signal: context.signal, tag: 'validation.asset-accept'},
    )
  if (fileType) resolvedFileTypes.set(assetId, fileType)
  return fileType
}

/** @internal */
export function createAssetAcceptValidator(
  accept: string,
  assetType: AcceptedAssetType,
): CustomValidator {
  return async (value, context) => {
    const assetId = getAssetId(value)
    if (assetId === undefined) return true

    const fileType = await fetchAssetFileType(assetId, context)
    if (fileType === null || assetMatchesAccept(fileType, accept)) return true

    return {
      code: validationMarkerCodes.assetNotAccepted,
      details: {accept, mimeType: fileType.mimeType, extension: fileType.extension},
      message: context.i18n.t('validation:object.asset-not-accepted', {
        context: assetType,
        mimeType: fileType.mimeType ?? fileType.extension,
      }),
    }
  }
}
