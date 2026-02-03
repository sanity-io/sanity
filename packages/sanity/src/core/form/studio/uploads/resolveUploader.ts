import * as is from '../../utils/is'
import {accepts} from './accepts'
import {type FileLike, type Uploader} from './types'
import {uploaders} from './uploaders'
import {type SchemaType} from '@sanity/types'

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
