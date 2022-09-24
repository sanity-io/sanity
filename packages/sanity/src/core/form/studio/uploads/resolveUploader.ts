import type {SchemaType} from '@sanity/types'
import * as is from '../../utils/is'
import {FIXME} from '../../../FIXME'
import type {FileLike, Uploader} from './types'
import {uploaders} from './uploaders'
import {accepts} from './accepts'

export function resolveUploader(type: SchemaType, file: FileLike): Uploader | null {
  return (
    uploaders.find((uploader) => {
      return (
        is.type(uploader.type, type) &&
        accepts(file, uploader.accepts) &&
        accepts(file, (type.options as FIXME)?.accept || '')
      )
    }) || null
  )
}
