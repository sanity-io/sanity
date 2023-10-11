/* eslint-disable no-loop-func */

import {Path, SanityDocument, SchemaType} from '@sanity/types'
import {isArray, isRecord} from 'sanity'

export function getPathTypes(options: {
  path: Path
  schemaType: SchemaType
  value: Partial<SanityDocument> | null
}): SchemaType[] {
  const {path, schemaType, value} = options
  const result: SchemaType[] = []

  let s = schemaType
  let v: unknown = value

  for (const segment of path) {
    // field name
    if (typeof segment === 'string') {
      if (!isRecord(v) && v !== undefined) {
        throw new Error(`Parent value is not an object, cannot get path segment: .${segment}`)
      }

      if (s.jsonType !== 'object') {
        throw new Error(
          `Parent type is not an object schema type, cannot get path segment: .${segment}`,
        )
      }

      v = v?.[segment]

      const field = s.fields.find((f) => f.name === segment)

      if (!field) {
        throw new Error(`Field type not found: .${segment}`)
      }

      s = field.type

      result.push(s)

      continue
    }

    // array item index
    if (typeof segment === 'number') {
      if (!isArray(v) && v !== undefined) {
        throw new Error(`Parent value is not an array, cannot get path segment: [${segment}]`)
      }

      if (s.jsonType !== 'array') {
        throw new Error(
          `Parent type is not an array schema type, cannot get path segment: [${segment}]`,
        )
      }

      v = v?.[segment]

      const itemType = s.of.find((ofType) => {
        if (typeof v === 'string') {
          return ofType.jsonType === 'string'
        }

        if (typeof v === 'number') {
          return ofType.jsonType === 'number'
        }

        if (typeof v === 'boolean') {
          return ofType.jsonType === 'boolean'
        }

        if (isRecord(v)) {
          return ofType.name === v?._type
        }

        return false
      })

      if (!itemType) {
        throw new Error(`Item type not found: [${segment}]`)
      }

      s = itemType

      result.push(s)

      continue
    }

    // array item key
    if (isRecord(segment) && segment._key) {
      if (!isArray(v)) {
        throw new Error(
          `Parent value is not an array, cannot get path segment: [_key == ${segment}]`,
        )
      }

      if (s.jsonType !== 'array') {
        throw new Error(
          `Parent type is not an array schema type, cannot get path segment: .${segment}`,
        )
      }

      const values = v ?? []

      v = values.find((i) => isRecord(i) && i._key === segment._key)

      if (!isRecord(v)) {
        throw new Error(`Array item not found: [_key == ${segment._key}]`)
      }

      const ofType = s.of.find((i) => isRecord(v) && i.name === v?._type)

      if (!ofType) {
        throw new Error(`Array item type not found: .${v?._type}`)
      }

      s = ofType

      result.push(s)

      continue
    }

    throw new Error(`Invalid path segment: ${JSON.stringify(segment)}`)
  }

  return result
}
