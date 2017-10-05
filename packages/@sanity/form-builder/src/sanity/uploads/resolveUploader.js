// @flow
import accept from 'attr-accept'
import uploaders from './uploaders'
import {get} from 'lodash'
import type {Uploader} from './typedefs'
import type {Type} from '../../typedefs'

// todo: extract and reuse
function is(typeName: string, type: Type): boolean {
  if (!type) {
    return false
  }
  return type.name === typeName || is(typeName, type.type)
}

export default function resolveUploader(type: Type, file: File) : ?Uploader {
  return uploaders.find(uploader => {
    return is(uploader.type, type)
      && accept(file, uploader.accepts)
      && accept(file, get(type.options, 'accept') || '')
  })
}
