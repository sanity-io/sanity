import {defaultComponents} from './defaultComponents'
import {SchemaType, DiffComponent} from './types'

export function resolveDiffComponent(type: SchemaType): DiffComponent | undefined {
  let itType: SchemaType | undefined = type
  while (itType) {
    const resolved = itType.diffComponent || defaultComponents[itType.name]
    if (resolved) {
      return resolved
    }
    itType = itType.type
  }

  return defaultComponents[type.jsonType] || undefined
}
