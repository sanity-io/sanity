// @flow
import handlers from '../../import/handlers'
import accept from 'attr-accept'
import type {Type} from './types'

// todo: extract and reuse
function is(typeName, type) {
  if (!type) {
    return false
  }
  return type.name === typeName || is(typeName, type.type)
}

export function findMatchingImporter(type: Type, file: File) {
  debugger
  // find the first member that has a matching handler
  for (let i = 0; i < type.of.length; i++) {
    const memberType = type.of[i]
    const keys = Object.keys(handlers)
    for (let j = 0; j < keys.length; j++) {
      const typeName = keys[j]
      if (is(typeName, memberType)) {
        const mimeTypes = Object.keys(handlers[typeName])
        for (let x = 0; x < mimeTypes.length; x++) {
          const mimeType = mimeTypes[x]
          if (accept(file, mimeType)) {
            return {importer: handlers[typeName][mimeType], memberType}
          }
        }
      }
    }
  }
  return {importer: null, memberType: null}
}
