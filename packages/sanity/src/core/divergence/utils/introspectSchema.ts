import {
  isArraySchemaType,
  isObjectSchemaType,
  type PathSegment,
  type SchemaType,
} from '@sanity/types'

import {getTypeChain} from '../../form/studio/inputResolver/helpers'
import {normalizePathSegment, type PathSegmentWithType} from './flatten'

/**
 * Extract the schema types that lead to the provided path.
 *
 * For each segment of the provided path, the corresponding schema type is yielded.
 *
 * If any path segment is ambiguous (e.g. part of a polymorphic array), a `PathSegmentWithType`
 * segment must be provided instead. The introspection process will select the schema type that
 * matches the specified type.
 *
 * @internal
 */
export function* introspectSchema(
  schemaType: SchemaType | undefined,
  path: (PathSegment | PathSegmentWithType)[],
  cache: WeakMap<SchemaType, Record<string, SchemaType>> = new WeakMap(),
): Generator<SchemaType> {
  const [head, ...tail] = path

  if (typeof schemaType === 'undefined') {
    return
  }

  if (typeof head === 'undefined') {
    return
  }

  const cacheKey = JSON.stringify(path)
  let cachedSchemaType = cache.get(schemaType)

  if (typeof cachedSchemaType === 'undefined') {
    cachedSchemaType = {}
    cache.set(schemaType, cachedSchemaType)
  }

  const cachedPath = cachedSchemaType?.[cacheKey]
  const {segment: headSegment, type: headType} = normalizePathSegment(head)

  let headSchemaType: SchemaType | undefined

  if (typeof cachedPath !== 'undefined') {
    headSchemaType = cachedPath
  } else {
    if (isObjectSchemaType(schemaType)) {
      headSchemaType = schemaType.fields.find((field) => field.name === headSegment)?.type
    }

    if (isArraySchemaType(schemaType)) {
      if (schemaType.of.length === 0) {
        throw new Error(
          `Array schema at segment \`${JSON.stringify(headSegment)}\` has no constituent types`,
        )
      }

      if (schemaType.of.length === 1) {
        headSchemaType = schemaType.of[0]
      } else {
        if (typeof headType === 'undefined') {
          throw new Error(
            `No type hint provided for polymorphic array segment: \`${JSON.stringify(headSegment)}\``,
          )
        }

        headSchemaType = schemaType.of.find((type) => {
          const typeChain = getTypeChain(type, new Set())
          return typeChain.some(({name}) => name === headType)
        })
      }
    }

    if (typeof headSchemaType === 'undefined') {
      throw new Error(`Could not resolve schema segment: \`${JSON.stringify(headSegment)}\``)
    }

    cachedSchemaType[cacheKey] = headSchemaType
  }

  yield headSchemaType
  yield* introspectSchema(headSchemaType, tail, cache)
}
