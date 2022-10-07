import {SchemaType} from '@sanity/types'
import {defaultComponents} from './defaultComponents'

type FIXME = any

/** @internal */
export function resolveDiffComponent(type: SchemaType): FIXME {
  let itType: SchemaType | undefined = type

  while (itType) {
    const resolved = itType?.components?.diff || defaultComponents[itType.name]

    if (resolved) {
      return resolved
    }

    itType = itType.type
  }

  return defaultComponents[type.jsonType]
}
