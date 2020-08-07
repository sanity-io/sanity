/* eslint-disable max-depth */
import {toString as pathToString} from '@sanity/util/paths'
import {Diff, ObjectDiff, Path, FieldDiff} from '@sanity/diff'
import {resolveDiffComponent} from '../../../components/diffs/resolveDiffComponent'
import {Annotation} from '../history/types'
import {SchemaType, ChangeNode} from '../types'

export function buildChangeList(
  schemaType: SchemaType,
  diff: ObjectDiff<Annotation>,
  path: Path,
  titlePath: string[]
): ChangeNode[] {
  const list: ChangeNode[] = []

  const diffComponent = resolveDiffComponent(schemaType)
  if (diffComponent) {
    const fieldDiff = getDiffAtPath(diff, path)
    if (fieldDiff) {
      list.push({
        type: 'field',
        diff: fieldDiff,
        key: pathToString(path),
        path,
        titlePath,
        schemaType
      })
    }
  } else {
    schemaType.fields.forEach(field => {
      const fieldPath = path.concat([field.name])
      const fieldTitlePath = titlePath.concat([field.type.title || field.name])
      if (field.type.jsonType === 'object') {
        const objectChanges = buildChangeList(field.type, diff, fieldPath, fieldTitlePath)
        if (objectChanges.length > 1) {
          list.push({
            type: 'group',
            key: pathToString(fieldPath),
            path: fieldPath,
            titlePath: fieldTitlePath,
            changes: objectChanges
          })
        } else {
          list.push(...objectChanges)
        }
      } else {
        const fieldDiff = getDiffAtPath(diff, fieldPath)
        if (fieldDiff) {
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
  }

  return list
}

function getDiffAtPath(diff: ObjectDiff<Annotation>, path: Path): Diff<Annotation> | null {
  let node: Diff<Annotation> = diff

  for (const segment of path) {
    if (node.type === 'object' && typeof segment === 'string') {
      const fieldDiff: FieldDiff<Annotation> = node.fields[segment]
      if (!fieldDiff || fieldDiff.type === 'unchanged') {
        return null
      }

      if (fieldDiff.type === 'added' || fieldDiff.type === 'removed') {
        // @todo how do we want to handle this?
        return null
      }

      node = fieldDiff.diff
    } else {
      throw new Error(
        `Mismatch between path segment (${typeof segment}) and diff type (${diff.type})`
      )
    }
  }

  return node
}
