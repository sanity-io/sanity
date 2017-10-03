// @flow
import accept from 'attr-accept'
import importers from './uploaders'
import {get} from 'lodash'
import type {Type, Uploader} from './typedefs'

// todo: extract and reuse
function is(typeName: string, type: Type): boolean {
  if (!type) {
    return false
  }
  return type.name === typeName || is(typeName, type.type)
}

export default function resolveUploader(type: Type, file: File) : ?Uploader {
  return importers.find(handler => {
    return is(handler.type, type)
      && accept(file, handler.accepts)
      && accept(file, get(type.options, 'accept') || '')
  })
}
