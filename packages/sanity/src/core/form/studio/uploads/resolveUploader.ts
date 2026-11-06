import {type SchemaType} from '@sanity/types'
import {accepts} from '@sanity/validation/_internal'

import * as is from '../../utils/is'
import {type FileLike, type Uploader} from './types'
import {uploaders} from './uploaders'

export function resolveUploader(type: SchemaType, file: FileLike): Uploader | null {
  return (
    uploaders.find((uploader) => {
      return (
        is.type(uploader.type, type) &&
        accepts(file, uploader.accepts) &&
        accepts(file, type.options?.accept || '')
      )
    }) || null
  )
}
