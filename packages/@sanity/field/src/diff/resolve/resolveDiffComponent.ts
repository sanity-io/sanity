import {ComponentType} from 'react'
import diffResolvers from 'all:part:@sanity/base/diff-resolver'
import {defaultComponents} from '../components/defaultComponents'
import {SchemaType, DiffComponent, Diff, DiffComponentResolver} from '../types'

function tryResolve(schemaType: SchemaType): DiffComponent<any> | undefined {
  const resolvers = diffResolvers as DiffComponentResolver[]
  let component: ComponentType | undefined
  for (const resolver of resolvers) {
    if (typeof resolver !== 'function') {
      console.error('Diff component resolver is not a function: ', resolver)
      continue
    }

    component = resolver({schemaType})
    if (component) {
      return component as DiffComponent
    }
  }
  return undefined
}

export function resolveDiffComponent<D extends Diff = any>(
  type: SchemaType
): DiffComponent<D> | undefined {
  let itType: SchemaType | undefined = type
  while (itType) {
    const resolved = itType.diffComponent || tryResolve(itType) || defaultComponents[itType.name]
    if (resolved) {
      return resolved as DiffComponent<any>
    }
    itType = itType.type
  }

  return defaultComponents[type.jsonType] || undefined
}
