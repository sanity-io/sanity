import {type AssetSource, type SchemaType} from '@sanity/types'

import {type FormBuilderContextValue} from '../../FormBuilderContext'
import * as is from '../../utils/is'
import {accepts} from './accepts'
import {type FileLike} from './types'

export function resolveUploadAssetSources(
  type: SchemaType,
  formBuilder: FormBuilderContextValue,
  file?: FileLike,
): AssetSource[] {
  const supportsDirectImageUploads = formBuilder.__internal.image.directUploads
  const supportsDirectFileUploads = formBuilder.__internal.file.directUploads
  if (is.type('image', type)) {
    if (!supportsDirectImageUploads) {
      return []
    }
    if (file && !accepts(file, type.options?.accept || 'image/*')) {
      return []
    }
    const assetSources = formBuilder.__internal.image.assetSources
    const sourcesWithUploader = assetSources.filter((source) => Boolean(source.Uploader))
    // If no asset sources have an Uploader, return all sources to allow drag-and-drop
    // to proceed. The upload step will handle missing Uploaders by finding a fallback.
    return sourcesWithUploader.length > 0 ? sourcesWithUploader : assetSources
  }
  if (is.type('file', type)) {
    if (!supportsDirectFileUploads) {
      return []
    }
    if (file && !accepts(file, type.options?.accept || '')) {
      return []
    }
    const assetSources = formBuilder.__internal.file.assetSources
    const sourcesWithUploader = assetSources.filter((source) => Boolean(source.Uploader))
    // If no asset sources have an Uploader, return all sources to allow drag-and-drop
    // to proceed. The upload step will handle missing Uploaders by finding a fallback.
    return sourcesWithUploader.length > 0 ? sourcesWithUploader : assetSources
  }
  return []
}
