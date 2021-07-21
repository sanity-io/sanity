import {SchemaType} from '@sanity/types'
import accept from 'attr-accept'
import * as is from '../../utils/is'
import uploaders from './uploaders'
import {FileIsh, Uploader} from './types'

export default function resolveUploader(type: SchemaType, file: FileIsh): Uploader | null {
  return uploaders.find((uploader) => {
    return (
      is.type(uploader.type, type) &&
      accept(file, uploader.accepts) &&
      accept(file, (type.options as any)?.accept || '')
    )
  })
}
