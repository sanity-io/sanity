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
    return formBuilder.__internal.image.assetSources.filter((source) => Boolean(source.Uploader))
  }
  if (is.type('file', type)) {
    if (!supportsDirectFileUploads) {
      return []
    }
    if (file && !accepts(file, type.options?.accept || '')) {
      return []
    }
    return formBuilder.__internal.file.assetSources.filter((source) => Boolean(source.Uploader))
  }
  return []
}
