import {type AssetSource, type SchemaType} from '@sanity/types'

import {type FormBuilderContextValue} from '../../FormBuilderContext'
import * as is from '../../utils/is'
import {accepts} from './accepts'
import {type FileLike} from './types'

/**
 * Returns sources with Uploaders, or all sources if none have Uploaders.
 * Enables drag-and-drop for custom asset sources (UploadPlaceholder creates default uploader).
 */
function filterAssetSourcesWithFallback(assetSources: AssetSource[]): AssetSource[] {
  const sourcesWithUploader = assetSources.filter((source) => Boolean(source.Uploader))
  return sourcesWithUploader.length > 0 ? sourcesWithUploader : assetSources
}

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
    return filterAssetSourcesWithFallback(formBuilder.__internal.image.assetSources)
  }
  if (is.type('file', type)) {
    if (!supportsDirectFileUploads) {
      return []
    }
    if (file && !accepts(file, type.options?.accept || '')) {
      return []
    }
    return filterAssetSourcesWithFallback(formBuilder.__internal.file.assetSources)
  }
  return []
}
