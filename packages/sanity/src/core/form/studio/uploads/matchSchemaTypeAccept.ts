import {type SchemaType} from '@sanity/types'

import {_isType} from '../../../util/schemaUtils'
import {accepts} from './accepts'
import {type FileLike} from './types'

const ASSET_TYPE_CONFIG = {
  image: {mimePrefix: 'image/', defaultAccept: 'image/*'} as const,
  file: {defaultAccept: ''} as const,
  video: {mimePrefix: 'video/', defaultAccept: 'video/*'} as const,
} as const

/**
 * Check if a file matches a schema type's acceptance criteria.
 * Used for image, file, and video inputs when validating drag-and-drop or paste.
 */
export function matchesSchemaTypeAccept(
  file: FileLike,
  schemaType: SchemaType,
  assetType: keyof typeof ASSET_TYPE_CONFIG,
): boolean {
  const config = ASSET_TYPE_CONFIG[assetType]
  if ('mimePrefix' in config && !file.type.startsWith(config.mimePrefix)) {
    return false
  }
  const acceptString = (schemaType.options?.accept as string) ?? config.defaultAccept
  return accepts(file, acceptString)
}

/**
 * Get the schema type and asset type for a file from a list of types.
 * Returns the first matching type for image, file, or video.
 */
export function findMatchingSchemaType(
  file: FileLike,
  types: SchemaType[],
): {schemaType: SchemaType; assetType: keyof typeof ASSET_TYPE_CONFIG} | null {
  const imageType = types.find((t) => _isType(t, 'image'))
  if (
    imageType &&
    file.type.startsWith('image/') &&
    matchesSchemaTypeAccept(file, imageType, 'image')
  ) {
    return {schemaType: imageType, assetType: 'image'}
  }

  const fileType = types.find((t) => _isType(t, 'file'))
  if (fileType && matchesSchemaTypeAccept(file, fileType, 'file')) {
    return {schemaType: fileType, assetType: 'file'}
  }

  const videoType = types.find((t) => _isType(t, 'sanity.video'))
  if (
    videoType &&
    file.type.startsWith('video/') &&
    matchesSchemaTypeAccept(file, videoType, 'video')
  ) {
    return {schemaType: videoType, assetType: 'video'}
  }

  return null
}
