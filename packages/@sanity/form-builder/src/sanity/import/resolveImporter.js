// @flow
import accept from 'attr-accept'
import importers from './importers'
import {get} from 'lodash'
import type {Type} from '../../inputs/Array/types'

// todo: extract and reuse
function is(typeName: string, type: Type): boolean {
  if (!type) {
    return false
  }
  return type.name === typeName || is(typeName, type.type)
}

export default function resolveImporter(type: Type, file: File) {
  return importers.find(handler => {
    return is(handler.type, type)
      && accept(file, handler.accepts)
      && accept(file, get(type.options, 'accept') || '')
  })
}
