import {ArraySchemaType, isTypedObject, SchemaType} from '@sanity/types'
import {Diff} from '../types'

export function resolveTypeName(value: unknown): string {
  return isTypedObject(value) ? value._type : resolveJSType(value)
}

export function getArrayDiffItemType(
  diff: Diff,
  schemaType: ArraySchemaType,
): {fromType?: SchemaType; toType?: SchemaType} {
  if (diff.action === 'added') {
    return {
      toType: resolveArrayMemberType(schemaType, diff.toValue),
    }
  }

  if (diff.action === 'changed') {
    return {
      fromType: resolveArrayMemberType(schemaType, diff.fromValue),
      toType: resolveArrayMemberType(schemaType, diff.toValue),
    }
  }

  if (diff.action === 'removed') {
    return {
      fromType: resolveArrayMemberType(schemaType, diff.fromValue),
    }
  }

  // unchanged
  return {
    toType: resolveArrayMemberType(schemaType, diff.toValue),
  }
}

function resolveArrayMemberType(
  schemaType: ArraySchemaType,
  value: unknown,
): SchemaType | undefined {
  const typeName = resolveTypeName(value)
  const declared = schemaType.of.find((candidate) => candidate.name === typeName)
  if (declared) {
    return declared as any
  }

  return (schemaType.of.length === 1 ? schemaType.of[0] : undefined) as any
}

function resolveJSType(val: unknown) {
  if (Array.isArray(val)) {
    return 'array'
  }

  if (val === null) {
    return 'null'
  }

  return typeof val
}
