import {ComponentType} from 'react'
import diffResolvers from 'all:part:@sanity/base/diff-resolver'
import {defaultComponents} from './defaultComponents'
import {SchemaType, DiffComponent} from './types'

function tryResolve(type: SchemaType): DiffComponent | undefined {
  let component: ComponentType | undefined
  for (const resolver of diffResolvers) {
    component = resolver(type)
    if (component) {
      return component as DiffComponent
    }
  }
  return undefined
}

export function resolveDiffComponent(type: SchemaType): DiffComponent | undefined {
  let itType: SchemaType | undefined = type
  while (itType) {
    const resolved = itType.diffComponent || tryResolve(itType) || defaultComponents[itType.name]
    if (resolved) {
      return resolved
    }
    itType = itType.type
  }

  return defaultComponents[type.jsonType] || undefined
}
