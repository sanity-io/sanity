/* eslint-disable max-depth */
import {toString as pathToString} from '@sanity/util/paths'
import {Diff, ObjectDiff, Path, FieldDiff, ArrayDiff} from '@sanity/diff'
import {resolveDiffComponent} from '../../../diffs/resolveDiffComponent'
import {Annotation} from '../history/types'
import {SchemaType} from '../types'
import {resolveTypeName} from './schemaUtils/resolveType'
import {ArrayItemMetadata, ChangeNode} from './types'

export function buildChangeList(
  schemaType: SchemaType,
  diff: ObjectDiff<Annotation>,
  path: Path = [],
  titlePath: string[] = []
): ChangeNode[] {
  const list: ChangeNode[] = []

  const diffComponent = resolveDiffComponent(schemaType)
  if (diffComponent) {
    const fieldDiff = getDiffAtPath(diff, path)
    if (fieldDiff && fieldDiff.isChanged) {
      list.push({
        type: 'field',
        diff: fieldDiff,
        key: pathToString(path),
        path,
        titlePath,
        schemaType
      })
    }

    return list
  }

  // eslint-disable-next-line complexity
  schemaType.fields.forEach(field => {
    const fieldPath = path.concat([field.name])
    const fieldTitlePath = titlePath.concat([field.type.title || field.name])
    if (field.type.jsonType === 'object') {
      const objectChanges = buildChangeList(field.type, diff, fieldPath, [])
      if (objectChanges.length > 1) {
        list.push({
          type: 'group',
          key: pathToString(fieldPath),
          path: fieldPath,
          titlePath: fieldTitlePath,
          changes: objectChanges
        })
      } else if (objectChanges.length === 1) {
        list.push({
          ...objectChanges[0],
          titlePath: fieldTitlePath.concat(objectChanges[0].titlePath)
        })
      }
    } else if (field.type.jsonType === 'array') {
      const fieldDiff = getDiffAtPath(diff, fieldPath)
      if (fieldDiff && fieldDiff.type === 'array' && fieldDiff.isChanged) {
        list.push({
          type: 'array',
          diff: fieldDiff,
          key: fieldPath.join('.'),
          path: fieldPath,
          titlePath: fieldTitlePath,
          schemaType: field.type,
          items: getArrayDiffItemTypes(fieldDiff, field as any)
        })
      }
    } else {
      const fieldDiff = getDiffAtPath(diff, fieldPath)
      if (fieldDiff && fieldDiff.isChanged) {
        list.push({
          type: 'field',
          diff: fieldDiff,
          key: fieldPath.join('.'),
          path: fieldPath,
          titlePath: fieldTitlePath,
          schemaType: field.type
        })
      }
    }
  })

  return list
}

function getDiffAtPath(diff: ObjectDiff<Annotation>, path: Path): Diff<Annotation> | null {
  let node: Diff<Annotation> = diff

  for (const pathSegment of path) {
    if (node.type === 'object' && typeof pathSegment === 'string') {
      const fieldDiff: FieldDiff<Annotation> = node.fields[pathSegment]
      if (!fieldDiff || fieldDiff.type === 'unchanged') {
        return null
      }

      if (fieldDiff.type === 'added' || fieldDiff.type === 'removed') {
        // @todo how do we want to handle this?
        // @todo to test, set a boolean field from undefined to a value
        return null
      }

      node = fieldDiff.diff
    } else {
      throw new Error(
        `Mismatch between path segment (${typeof pathSegment}) and diff type (${diff.type})`
      )
    }
  }

  return node
}

function resolveArrayOfType(field: any, value: any): any | null {
  const typeName = resolveTypeName(value)

  return field.type.of.find(t => t.name === typeName) || null
}

function getArrayDiffItemTypes(
  diff: ArrayDiff<Annotation>,
  field: SchemaType
): ArrayItemMetadata[] {
  return diff.items.map(diffItem => {
    // for (const diffItem of diff.items) {
    if (diffItem.type === 'added') {
      return {
        toType: resolveArrayOfType(field, diffItem.toValue)
      }
    } else if (diffItem.type === 'changed') {
      return {
        fromType: resolveArrayOfType(field, diffItem.toValue),
        toType: resolveArrayOfType(field, diffItem.toValue)
      }
      //
    } else if (diffItem.type === 'removed') {
      return {
        fromType: resolveArrayOfType(field, diffItem.fromValue)
      }
    }

    // unchanged
    return {
      toType: resolveArrayOfType(field, diffItem.toValue)
    }
  })
}
