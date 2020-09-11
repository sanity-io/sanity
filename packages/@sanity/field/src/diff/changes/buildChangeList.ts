/* eslint-disable complexity */
import {pathToString, pathsAreEqual, getItemKeySegment} from '../../paths'
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
  DiffComponent,
  FieldChangeNode,
  ItemDiff,
  MultiFieldSet,
  Fieldset
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
      return buildArrayChangeList(schemaType, diff, path, titlePath, context)
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
  const {fieldFilter, ...context} = diffContext
  const changes: ChangeNode[] = []

  for (const field of schemaType.fields) {
    const fieldDiff = diff.fields[field.name]
    if (!fieldDiff || !fieldDiff.isChanged || (fieldFilter && !fieldFilter.includes(field.name))) {
      continue
    }

    const fieldPath = path.concat([field.name])
    const fieldSet = field.fieldset ? findFieldset(field.fieldset, schemaType) : undefined
    const fieldTitlePath = titlePath.concat([
      ...(fieldSet ? [fieldSet.title || fieldSet.name] : []),
      ...[field.type.title || field.name]
    ])

    changes.push(...buildChangeList(field.type, fieldDiff, fieldPath, fieldTitlePath, context))
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

export function buildArrayChangeList(
  schemaType: ArraySchemaType,
  diff: ArrayDiff,
  path: Path = [],
  titlePath: ChangeTitlePath = [],
  context: DiffContext = {}
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

  let renderHeader = true
  let component: DiffComponent | undefined
  const diffComponent = resolveDiffComponent(schemaType)
  if (diffComponent) {
    renderHeader = typeof diffComponent === 'function' ? true : diffComponent.renderHeader
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
    renderHeader,
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

function findFieldset(name: string, schemaType: ObjectSchemaType): MultiFieldSet | undefined {
  const fieldSet = schemaType.fieldsets.find(set => isMultiFieldset(set) && set.name === name)
  return fieldSet && isMultiFieldset(fieldSet) ? fieldSet : undefined
}

function isMultiFieldset(set: Fieldset): set is MultiFieldSet {
  return 'fields' in set
}
