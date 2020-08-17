import {ComponentType} from 'react'
import diffResolvers from 'all:part:@sanity/base/diff-resolver'
import {SchemaType, DiffComponent} from '@sanity/field/diff'
import {defaultComponents} from './defaultComponents'

function tryResolve(schemaType: SchemaType): DiffComponent<any> | undefined {
  let component: ComponentType | undefined
  for (const resolver of diffResolvers) {
    component = resolver({schemaType})
    if (component) {
      return component as DiffComponent
    }
  }
  return undefined
}

export function resolveDiffComponent(type: SchemaType): DiffComponent<any> | undefined {
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
