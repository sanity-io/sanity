import {ArraySchemaType, ObjectSchemaType, SchemaType} from '@sanity/types'
import {ComponentType} from 'react'
import {diffResolvers} from '../../TODO'
import {Diff, DiffComponent, DiffComponentOptions} from '../../types'
import {defaultComponents} from './defaultComponents'

/** @internal */
export function resolveDiffComponent<D extends Diff = any>(
  type: SchemaType,
  parentSchemaType?: ArraySchemaType | ObjectSchemaType
): DiffComponent<D> | DiffComponentOptions | undefined {
  let itType: SchemaType | undefined = type

  while (itType) {
    const resolved =
      itType?.components?.diff ||
      tryResolve(itType, parentSchemaType) ||
      defaultComponents[itType.name]

    if (resolved) {
      return resolved as DiffComponent<any>
    }

    itType = itType.type
  }

  const isDateType = ['date', 'datetime'].includes(type.name)

  // The date and datetime has the same jsonType as string, but we want to use
  // a different default component for them. Therefore, we use the name of the
  // type instead of the jsonType for these types.
  const defaultComponentKey = isDateType ? type.name : type.jsonType

  return defaultComponents[defaultComponentKey]
}

function tryResolve(
  schemaType: SchemaType,
  parentSchemaType?: ArraySchemaType | ObjectSchemaType
): DiffComponent<any> | DiffComponentOptions | undefined {
  const resolvers = diffResolvers

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
