// @flow
import accept from 'attr-accept'
import uploaders from './uploaders'
import {get} from 'lodash'
import type {Uploader} from './typedefs'
import type {Type} from '../../typedefs'
import * as is from '../../utils/is'

export default function resolveUploader(type: Type, file: File): ?Uploader {
  return uploaders.find(uploader => {
    return (
      is.type(uploader.type, type) &&
      accept(file, uploader.accepts) &&
      accept(file, get(type.options, 'accept') || '')
    )
  })
}
