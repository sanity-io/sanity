import {type CustomValidator, type ValidationContext} from '@sanity/types'

import {validationMarkerCodes} from '../codes'
import {accepts} from '../util/accepts'

const DEFAULT_API_VERSION = '2025-02-19'

const ASSET_FILE_TYPE_QUERY = `*[_id == $id][0]{mimeType, extension, originalFilename}`

type AssetFileType = {
  mimeType?: string | null
  extension?: string | null
  originalFilename?: string | null
}

export type AcceptedAssetType = 'image' | 'file'

// Asset ids are content hashes, so a resolved file type never changes for a given id.
const resolvedFileTypes = new Map<string, AssetFileType>()

function isUnknownFileType(fileType: AssetFileType): boolean {
  return [fileType.mimeType, fileType.extension].every((value) => (value ?? '') === '')
}

/**
 * Checks a stored asset against an HTML `accept` string with the same matcher uploads and
 * copy-paste use.
 *
 * @internal
 */
export function assetMatchesAccept(fileType: AssetFileType, accept: string): boolean {
  return accepts({type: fileType.mimeType ?? '', name: getAssetFilename(fileType)}, accept)
}

function getAssetFilename(fileType: AssetFileType): string | undefined {
  if (fileType.originalFilename) return fileType.originalFilename
  return fileType.extension ? `asset.${fileType.extension}` : undefined
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
    if (fileType === null || isUnknownFileType(fileType) || assetMatchesAccept(fileType, accept)) {
      return true
    }

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
