import {ComponentType} from 'react'
import diffResolvers from 'all:part:@sanity/base/diff-resolver'
import {
  ArraySchemaType,
  Diff,
  DiffComponent,
  DiffComponentOptions,
  DiffComponentResolver,
  ObjectSchemaType,
  SchemaType,
} from '../../types'
import {defaultComponents} from './defaultComponents'

export function resolveDiffComponent<D extends Diff = any>(
  type: SchemaType,
  parentSchemaType?: ArraySchemaType | ObjectSchemaType
): DiffComponent<D> | DiffComponentOptions | undefined {
  let itType: SchemaType | undefined = type
  while (itType) {
    const resolved =
      itType.diffComponent || tryResolve(itType, parentSchemaType) || defaultComponents[itType.name]

    if (resolved) {
      return resolved as DiffComponent<any>
    }

    itType = itType.type
  }

  return defaultComponents[type.jsonType] || undefined
}

function tryResolve(
  schemaType: SchemaType,
  parentSchemaType?: ArraySchemaType | ObjectSchemaType
): DiffComponent<any> | DiffComponentOptions | undefined {
  const resolvers = diffResolvers as DiffComponentResolver[]
  let resolved: ComponentType | DiffComponentOptions | undefined
  for (const resolver of resolvers) {
    if (typeof resolver !== 'function') {
      // eslint-disable-next-line no-console
      console.error('Diff component resolver is not a function: ', resolver)
      continue
    }

    resolved = resolver({schemaType, parentSchemaType})
    if (resolved) {
      return resolved as DiffComponent
    }
  }
  return undefined
}
