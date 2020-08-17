import {toString as pathToString} from '@sanity/util/paths'
import {ObjectDiff, ObjectSchemaType, Path} from '@sanity/field/diff'
import {resolveDiffComponent} from '../../../diffs/resolveDiffComponent'
import {getArrayDiffItemTypes, getDiffAtPath} from './helpers'
import {ChangeNode} from './types'

// eslint-disable-next-line complexity
export function buildChangeList(
  schemaType: ObjectSchemaType,
  diff: ObjectDiff,
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

  for (const field of schemaType.fields) {
    const fieldPath = path.concat([field.name])
    const fieldTitlePath = titlePath.concat([field.type.title || field.name])
    if (field.type.jsonType === 'object') {
      const objectChanges = buildChangeList(field.type, diff, fieldPath, [])
      // eslint-disable-next-line max-depth
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
          key: pathToString(fieldPath),
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
          key: pathToString(fieldPath),
          path: fieldPath,
          titlePath: fieldTitlePath,
          schemaType: field.type
        })
      }
    }
  }

  return list
}
