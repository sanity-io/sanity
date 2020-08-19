import {
  ArrayDiff,
  ArrayItemMetadata,
  ArraySchemaType,
  Diff,
  ObjectDiff,
  ObjectField,
  Path,
  SchemaType
} from '@sanity/field/diff'
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

function resolveArrayOfType(
  field: ObjectField<ArraySchemaType>,
  value: unknown
): SchemaType | undefined {
  const typeName = resolveTypeName(value)
  const declared = field.type.of.find(candidate => candidate.name === typeName)
  if (declared) {
    return declared
  }

  return field.type.of.length === 1 ? field.type.of[0] : undefined
}

export function getArrayDiffItemTypes(
  diff: ArrayDiff,
  field: ObjectField<ArraySchemaType>
): ArrayItemMetadata[] {
  return diff.items.map(diffItem => {
    if (diffItem.diff.action === 'added') {
      return {
        toType: resolveArrayOfType(field, diffItem.diff.toValue)
      }
    } else if (diffItem.diff.action === 'changed') {
      return {
        fromType: resolveArrayOfType(field, diffItem.diff.fromValue),
        toType: resolveArrayOfType(field, diffItem.diff.toValue)
      }
    } else if (diffItem.diff.action === 'removed') {
      return {
        fromType: resolveArrayOfType(field, diffItem.diff.fromValue)
      }
    }

    // unchanged
    return {
      toType: resolveArrayOfType(field, diffItem.diff.toValue)
    }
  })
}
