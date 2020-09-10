/* eslint-disable complexity */
import {pathToString} from '../../paths'
import {getValueError} from '../../validation'
import {getArrayDiffItemType} from '../../schema/helpers'
import {resolveDiffComponent} from '../resolve/resolveDiffComponent'
import {
  ObjectSchemaType,
  ObjectDiff,
  SchemaType,
  Diff,
  Path,
  ChangeTitlePath,
  ChangeNode,
  ArraySchemaType,
  ArrayDiff,
  DiffComponent
} from '../../types'

export function buildChangeList(
  schemaType: SchemaType,
  diff: Diff,
  path: Path = [],
  titlePath: ChangeTitlePath = []
): ChangeNode[] {
  const diffComponent = resolveDiffComponent(schemaType)

  if (!diffComponent) {
    if (schemaType.jsonType === 'object' && diff.type === 'object') {
      return buildObjectChangeList(schemaType, diff, path, titlePath)
    }

    if (schemaType.jsonType === 'array' && diff.type === 'array') {
      return buildArrayChangeList(schemaType, diff, path, titlePath)
    }
  }

  let error
  if (typeof diff.fromValue !== 'undefined') {
    error = getValueError(diff.fromValue, schemaType)
  }

  if (!error && typeof diff.toValue !== 'undefined') {
    error = getValueError(diff.toValue, schemaType)
  }

  let renderHeader = true
  let component: DiffComponent | undefined
  if (diffComponent) {
    renderHeader = typeof diffComponent === 'function' ? true : diffComponent.renderHeader
    component = typeof diffComponent === 'function' ? diffComponent : diffComponent.component
  }

  return [
    {
      type: 'field',
      diff,
      path,
      error,
      titlePath,
      schemaType,
      renderHeader,
      key: pathToString(path) || 'root',
      diffComponent: error ? undefined : component
    }
  ]
}

export function buildObjectChangeList(
  schemaType: ObjectSchemaType,
  diff: ObjectDiff,
  path: Path = [],
  titlePath: ChangeTitlePath = [],
  {fieldFilter}: {fieldFilter?: string[]} = {}
): ChangeNode[] {
  const changes: ChangeNode[] = []

  for (const field of schemaType.fields) {
    const fieldDiff = diff.fields[field.name]
    if (!fieldDiff || !fieldDiff.isChanged || (fieldFilter && !fieldFilter.includes(field.name))) {
      continue
    }

    const fieldPath = path.concat([field.name])
    const fieldTitlePath = titlePath.concat([field.type.title || field.name])

    changes.push(...buildChangeList(field.type, fieldDiff, fieldPath, fieldTitlePath))
  }

  if (changes.length > 1) {
    return [
      {
        type: 'group',
        diff,
        key: pathToString(path) || 'root',
        path,
        titlePath,
        changes: reduceTitlePaths(changes, titlePath.length)
      }
    ]
  }

  return changes
}

function buildArrayChangeList(
  schemaType: ArraySchemaType,
  diff: ArrayDiff,
  path: Path = [],
  titlePath: ChangeTitlePath = []
): ChangeNode[] {
  const changedOrMoved = diff.items.filter(
    item => item.hasMoved || item.diff.action !== 'unchanged'
  )

  if (changedOrMoved.length === 0) {
    return []
  }

  const list: ChangeNode[] = []
  const changes = changedOrMoved.reduce((acc, itemDiff) => {
    const memberTypes = getArrayDiffItemType(itemDiff.diff, schemaType)
    const memberType = memberTypes.toType || memberTypes.fromType
    if (!memberType) {
      // eslint-disable-next-line no-console
      console.warn('Could not determine schema type for item at %s', pathToString(path))
      return acc
    }

    const index = diff.items.indexOf(itemDiff)
    const itemPath = path.concat(index)
    const itemTitlePath = titlePath.concat({
      hasMoved: itemDiff.hasMoved,
      toIndex: itemDiff.toIndex,
      fromIndex: itemDiff.fromIndex,
      annotation: itemDiff.diff.action === 'unchanged' ? undefined : itemDiff.diff.annotation
    })

    acc.push(...buildChangeList(memberType, itemDiff.diff, itemPath, itemTitlePath))
    return acc
  }, list)

  if (changes.length > 1) {
    return [
      {
        type: 'group',
        diff,
        key: pathToString(path) || 'root',
        path,
        titlePath,
        changes: reduceTitlePaths(changes, titlePath.length)
      }
    ]
  }

  return changes
}

function reduceTitlePaths(changes: ChangeNode[], byLength = 1): ChangeNode[] {
  return changes.map(change => {
    change.titlePath = change.titlePath.slice(byLength)
    return change
  })
}
