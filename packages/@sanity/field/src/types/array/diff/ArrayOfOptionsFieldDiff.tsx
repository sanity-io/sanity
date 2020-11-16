import Preview from 'part:@sanity/base/preview'
import {useUserColorManager} from '@sanity/base/user-color'
import {isKeyedObject, TypedObject} from '@sanity/types'
import React from 'react'
import {
  Annotation,
  ArrayDiff,
  ArraySchemaType,
  Diff,
  DiffComponent,
  DiffTooltip,
  FromToArrow,
  getAnnotationColor,
  ItemDiff,
  SchemaType,
} from '../../../diff'
import {Checkbox} from '../../boolean/preview'
import {isEqual} from '../util/arrayUtils'
import styles from './ArrayOfOptionsFieldDiff.css'

interface NamedListOption {
  title?: string
  value: unknown
}

interface NormalizedListOption {
  title?: string
  value: unknown
  memberType?: Exclude<SchemaType, ArraySchemaType>
  isPresent: boolean
  annotation: Annotation
  itemIndex: number
}

export const ArrayOfOptionsFieldDiff: DiffComponent<ArrayDiff> = ({diff, schemaType}) => {
  const options = (schemaType as any).options?.list
  const colorManager = useUserColorManager()
  if (!Array.isArray(options)) {
    // Shouldn't happen, because the resolver should only resolve here if it does
    return null
  }

  return (
    <div>
      {diff.items
        .map((item) => normalizeItems(item, diff, schemaType as any))
        .filter((item): item is NormalizedListOption => item !== null)
        .sort(sortItems)
        .map((item, index) => {
          const {annotation, isPresent, value, memberType, title} = item
          const color = getAnnotationColor(colorManager, annotation)
          const action = isPresent ? 'Added' : 'Removed'
          return (
            <div className={styles.item} key={getItemKey(diff, index)}>
              <DiffTooltip annotations={annotation ? [annotation] : []} description={action}>
                <div className={styles.checkboxes}>
                  <Checkbox checked={!isPresent} color={color} />
                  <FromToArrow />
                  <Checkbox checked={isPresent} color={color} />
                </div>
              </DiffTooltip>
              <div className={styles.label}>
                <ItemPreview value={title || value} memberType={memberType} />
              </div>
            </div>
          )
        })}
    </div>
  )
}

function normalizeItems(
  item: ItemDiff,
  parentDiff: ArrayDiff,
  schemaType: ArraySchemaType
): NormalizedListOption | null {
  if (item.diff.action === 'unchanged') {
    return null
  }

  const {fromValue, toValue} = parentDiff
  const value = getValue(item.diff)
  const wasPresent = isInArray(value, fromValue)
  const isPresent = isInArray(value, toValue)
  if (wasPresent === isPresent) {
    return null
  }

  return {
    title: getItemTitle(value, schemaType),
    memberType: resolveMemberType(getValue(item.diff), schemaType),
    itemIndex: getOptionIndex(value, schemaType),
    annotation: item.annotation,
    isPresent,
    value,
  }
}

function sortItems(itemA: NormalizedListOption, itemB: NormalizedListOption): number {
  return itemA.itemIndex - itemB.itemIndex
}

function ItemPreview({value, memberType}: {memberType?: SchemaType; value: unknown}) {
  return (
    <div className={styles.itemPreview}>
      {typeof value === 'string' || typeof value === 'number' ? (
        value
      ) : (
        <Preview type={memberType} value={value} layout="default" />
      )}
    </div>
  )
}

function isInArray(value: unknown, parent?: unknown[] | null): boolean {
  const array = parent || []
  return typeof value === 'object' && value !== null
    ? array.some((item) => isEqual(item, value))
    : array.includes(value)
}

function getItemKey(diff: Diff, index: number): string | number {
  const value = diff.toValue || diff.fromValue
  return isKeyedObject(value) ? value._key : index
}

function getValue(diff: Diff) {
  return typeof diff.toValue === 'undefined' ? diff.fromValue : diff.toValue
}

function resolveMemberType(item: unknown, schemaType: ArraySchemaType) {
  const itemTypeName = resolveTypeName(item)
  return schemaType.of.find((memberType) => memberType.name === itemTypeName)
}

function resolveTypeName(value: unknown): string {
  const jsType = resolveJSType(value)
  if (jsType !== 'object') {
    return jsType
  }

  const obj = value as TypedObject
  return ('_type' in obj && obj._type) || jsType
}

function resolveJSType(val: unknown) {
  if (val === null) {
    return 'null'
  }

  if (Array.isArray(val)) {
    return 'array'
  }

  return typeof val
}

function isNamedOption(item: unknown | NamedListOption): item is NamedListOption {
  return typeof item === 'object' && item !== null && 'title' in item
}

function getOptionIndex(item: unknown, schemaType: ArraySchemaType): number {
  const list = (schemaType as any).options?.list || []
  return list.findIndex((opt) => isEqual(isNamedOption(opt) ? opt.value : opt, item))
}

function getItemTitle(item: unknown, schemaType: ArraySchemaType): string | undefined {
  const list = ((schemaType as any).options?.list || []) as NamedListOption[]
  const index = getOptionIndex(item, schemaType)
  return index === -1 ? undefined : list[index].title || undefined
}
