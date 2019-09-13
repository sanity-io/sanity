import accept from 'attr-accept'
import uploaders from './uploaders'
import {get} from 'lodash'
import {Uploader} from './typedefs'
import {Type} from '../../typedefs'
import * as is from '../../utils/is'

export default function resolveUploader(type: Type, file: File): Uploader | null {
  return uploaders.find(uploader => {
    return (
      is.type(uploader.type, type) &&
      accept(file, uploader.accepts) &&
      accept(file, get(type.options, 'accept') || '')
    )
  })
}
