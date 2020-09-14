/* eslint-disable complexity */
import {pathToString, pathsAreEqual, getItemKeySegment} from '../../paths'
import {getValueError} from '../../validation'
import {getArrayDiffItemType} from '../../schema/helpers'
import {resolveDiffComponent} from '../resolve/resolveDiffComponent'
import {
  ArrayDiff,
  ArraySchemaType,
  ChangeNode,
  ChangeTitlePath,
  Diff,
  DiffComponent,
  DiffComponentOptions,
  FieldChangeNode,
  ItemDiff,
  MultiFieldSet,
  ObjectDiff,
  ObjectField,
  ObjectSchemaType,
  Path,
  SchemaType,
  ShowDiffHeader
} from '../../types'

interface DiffContext {
  itemDiff?: ItemDiff
  parentDiff?: ArrayDiff | ObjectDiff
}

export function buildChangeList(
  schemaType: SchemaType,
  diff: Diff,
  path: Path = [],
  titlePath: ChangeTitlePath = [],
  context: DiffContext = {}
): ChangeNode[] {
  const diffComponent = resolveDiffComponent(schemaType)

  if (!diffComponent) {
    if (schemaType.jsonType === 'object' && diff.type === 'object') {
      return buildObjectChangeList(schemaType, diff, path, titlePath, context)
    }

    if (schemaType.jsonType === 'array' && diff.type === 'array') {
      return buildArrayChangeList(schemaType, diff, path, titlePath)
    }
  }

  return [getFieldChange(schemaType, diff, path, titlePath, context)]
}

export function buildObjectChangeList(
  schemaType: ObjectSchemaType,
  diff: ObjectDiff,
  path: Path = [],
  titlePath: ChangeTitlePath = [],
  diffContext: DiffContext & {fieldFilter?: string[]} = {}
): ChangeNode[] {
  const changes: ChangeNode[] = []

  const fieldSets = schemaType.fieldsets || schemaType.fields.map(field => ({single: true, field}))
  for (const fieldSet of fieldSets) {
    if (fieldSet.single) {
      changes.push(...buildFieldChange(fieldSet.field, diff, path, titlePath, diffContext))
    } else {
      changes.push(...buildFieldsetChangeList(fieldSet, diff, path, titlePath, diffContext))
    }
  }

  if (changes.length < 2) {
    return changes
  }

  return [
    {
      type: 'group',
      key: pathToString(path) || 'root',
      path,
      titlePath,
      changes: reduceTitlePaths(changes, titlePath.length)
    }
  ]
}

export function buildFieldChange(
  field: ObjectField,
  diff: ObjectDiff,
  path: Path,
  titlePath: ChangeTitlePath,
  diffContext: DiffContext & {fieldFilter?: string[]} = {}
): ChangeNode[] {
  const {fieldFilter, ...context} = diffContext
  const fieldDiff = diff.fields[field.name]
  if (!fieldDiff || !fieldDiff.isChanged || (fieldFilter && !fieldFilter.includes(field.name))) {
    return []
  }

  const fieldPath = path.concat([field.name])
  const fieldTitlePath = titlePath.concat([field.type.title || field.name])
  return buildChangeList(field.type, fieldDiff, fieldPath, fieldTitlePath, context)
}

export function buildFieldsetChangeList(
  fieldSet: MultiFieldSet,
  diff: ObjectDiff,
  path: Path,
  titlePath: ChangeTitlePath,
  diffContext: DiffContext & {fieldFilter?: string[]} = {}
): ChangeNode[] {
  const {fields, name, title} = fieldSet
  const {fieldFilter, ...context} = diffContext

  const fieldSetTitlePath = titlePath.concat([title || name])
  const changes: ChangeNode[] = []

  for (const field of fields) {
    const fieldDiff = diff.fields[field.name]
    if (!fieldDiff || !fieldDiff.isChanged || (fieldFilter && !fieldFilter.includes(field.name))) {
      continue
    }

    const fieldPath = path.concat([field.name])
    const fieldTitlePath = fieldSetTitlePath.concat([field.type.title || field.name])
    changes.push(...buildChangeList(field.type, fieldDiff, fieldPath, fieldTitlePath, context))
  }

  if (changes.length < 2) {
    return changes
  }

  return [
    {
      type: 'group',
      key: pathToString(path) || 'root',
      path,
      titlePath: fieldSetTitlePath,
      changes: reduceTitlePaths(changes, fieldSetTitlePath.length)
    }
  ]
}

export function buildArrayChangeList(
  schemaType: ArraySchemaType,
  diff: ArrayDiff,
  path: Path = [],
  titlePath: ChangeTitlePath = []
): ChangeNode[] {
  const changedOrMoved = diff.items.filter(
    item => (item.hasMoved && item.fromIndex !== item.toIndex) || item.diff.action !== 'unchanged'
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

    const segment =
      getItemKeySegment(itemDiff.diff.fromValue) ||
      getItemKeySegment(itemDiff.diff.toValue) ||
      diff.items.indexOf(itemDiff)

    const itemPath = path.concat(segment)
    const itemContext: DiffContext = {itemDiff, parentDiff: diff}
    const itemTitlePath = titlePath.concat({
      hasMoved: itemDiff.hasMoved,
      toIndex: itemDiff.toIndex,
      fromIndex: itemDiff.fromIndex,
      annotation: itemDiff.diff.action === 'unchanged' ? undefined : itemDiff.diff.annotation
    })

    const attachItemDiff = (change: ChangeNode): ChangeNode => {
      if (change.type === 'field' && pathsAreEqual(itemPath, change.path)) {
        change.itemDiff = itemDiff
      }

      return change
    }

    const children = buildChangeList(
      memberType,
      itemDiff.diff,
      itemPath,
      itemTitlePath,
      itemContext
    ).map(attachItemDiff)

    if (children.length === 0) {
      // This can happen when there are no changes to the actual element, it's just been moved
      acc.push(getFieldChange(memberType, itemDiff.diff, itemPath, itemTitlePath, itemContext))
    } else {
      acc.push(...children)
    }

    return acc
  }, list)

  if (changes.length > 1) {
    return [
      {
        type: 'group',
        key: pathToString(path) || 'root',
        path,
        titlePath,
        changes: reduceTitlePaths(changes, titlePath.length)
      }
    ]
  }

  return changes
}

function getFieldChange(
  schemaType: SchemaType,
  diff: Diff,
  path: Path,
  titlePath: ChangeTitlePath,
  {itemDiff, parentDiff}: DiffContext = {}
): FieldChangeNode {
  let error
  if (typeof diff.fromValue !== 'undefined') {
    error = getValueError(diff.fromValue, schemaType)
  }

  if (!error && typeof diff.toValue !== 'undefined') {
    error = getValueError(diff.toValue, schemaType)
  }

  let showHeader: DiffComponentOptions['showHeader'] = ShowDiffHeader.Always
  let component: DiffComponent | undefined
  const diffComponent = resolveDiffComponent(schemaType)
  if (diffComponent) {
    showHeader =
      typeof diffComponent === 'function' ? ShowDiffHeader.Always : diffComponent.showHeader
    component = typeof diffComponent === 'function' ? diffComponent : diffComponent.component
  }

  return {
    type: 'field',
    diff,
    path,
    error,
    itemDiff,
    parentDiff,
    titlePath,
    schemaType,
    showHeader,
    key: pathToString(path) || 'root',
    diffComponent: error ? undefined : component
  }
}

function reduceTitlePaths(changes: ChangeNode[], byLength = 1): ChangeNode[] {
  return changes.map(change => {
    change.titlePath = change.titlePath.slice(byLength)
    return change
  })
}
