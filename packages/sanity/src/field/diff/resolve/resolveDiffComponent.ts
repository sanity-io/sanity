import {SchemaType} from '@sanity/types'
import {Diff, DiffComponent, DiffComponentOptions} from '../../types'
import {defaultComponents} from './defaultComponents'

export function resolveDiffComponent<D extends Diff = any>(
  type: SchemaType
): DiffComponent<D> | DiffComponentOptions | undefined {
  let itType: SchemaType | undefined = type

  while (itType) {
    const resolved = itType?.components?.diff || defaultComponents[itType.name]

    if (resolved) {
      return resolved as DiffComponent<any>
    }

    itType = itType.type
  }

  return defaultComponents[type.jsonType]
}
