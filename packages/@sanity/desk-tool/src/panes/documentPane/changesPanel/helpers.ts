import {ArraySchemaType, Diff, ObjectDiff, Path, SchemaType} from '@sanity/field/diff'
import {isTypedObject} from '../../../diffs/helpers'

function resolveJSType(val: unknown) {
  if (Array.isArray(val)) {
    return 'array'
  }

  if (val === null) {
    return 'null'
  }

  return typeof val
}

export function resolveTypeName(value: unknown) {
  return isTypedObject(value) ? value._type : resolveJSType(value)
}

export function getDiffAtPath(diff: ObjectDiff, path: Path): Diff | null {
  let node: Diff = diff

  for (const pathSegment of path) {
    if (node.type === 'object' && typeof pathSegment === 'string') {
      node = node.fields[pathSegment]
      // eslint-disable-next-line max-depth
      if (!node) return null
    } else {
      throw new Error(
        `Mismatch between path segment (${typeof pathSegment}) and diff type (${diff.type})`
      )
    }
  }

  return node
}

function resolveArrayMemberType(
  schemaType: ArraySchemaType,
  value: unknown
): SchemaType | undefined {
  const typeName = resolveTypeName(value)
  const declared = schemaType.of.find(candidate => candidate.name === typeName)
  if (declared) {
    return declared
  }

  return schemaType.of.length === 1 ? schemaType.of[0] : undefined
}

export function getArrayDiffItemType(diff: Diff, schemaType: ArraySchemaType) {
  if (diff.action === 'added') {
    return {
      toType: resolveArrayMemberType(schemaType, diff.toValue)
    }
  }

  if (diff.action === 'changed') {
    return {
      fromType: resolveArrayMemberType(schemaType, diff.fromValue),
      toType: resolveArrayMemberType(schemaType, diff.toValue)
    }
  }

  if (diff.action === 'removed') {
    return {
      fromType: resolveArrayMemberType(schemaType, diff.fromValue)
    }
  }

  // unchanged
  return {
    toType: resolveArrayMemberType(schemaType, diff.toValue)
  }
}
