import React from 'react'
import {AnnotatedStringDiff, ArrayDiff, ObjectDiff, StringDiff} from '../../index'
import {startCase} from 'lodash'
import {ChildMap, PortableTextBlock, PortableTextChild, SpanTypeSchema} from './types'
import {SchemaType, ObjectSchemaType} from '../../types'
import InlineObject from './previews/InlineObject'

export const MISSING_TYPE_NAME = 'MISSING_TYPE'

export function isPTSchemaType(schemaType: SchemaType) {
  return schemaType.jsonType === 'object' && schemaType.name === 'block'
}
export function isHeader(node: PortableTextBlock) {
  return !!node.style && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.style)
}

export function createChildMap(blockDiff: ObjectDiff, schemaType: ObjectSchemaType) {
  // Create a map from span to diff
  const block = (diffDidRemove(blockDiff)
    ? blockDiff.fromValue
    : blockDiff.toValue) as PortableTextBlock
  const childMap: ChildMap = {}
  const children = block.children || []
  children.forEach(child => {
    // Fallback for renderer
    if (typeof child !== 'object' || typeof child._type !== 'string') {
      child._type = MISSING_TYPE_NAME
    }
    const childDiffs = findChildDiffs(blockDiff, child)
    let summary: React.ReactNode[] = []
    const cSchemaType = getChildSchemaType(schemaType.fields, child)
    let annotation

    // Summarize all diffs to this child
    // eslint-disable-next-line complexity
    childDiffs.forEach(cDiff => {
      const textDiff = cDiff.fields.text as StringDiff
      if (textDiff && textDiff.isChanged) {
        if (textDiff.action === 'changed') {
          summary.push(`Changed '${textDiff.fromValue}' to  '${textDiff.toValue}'`)
        } else {
          const text = textDiff.toValue || textDiff.fromValue
          summary.push(
            `${startCase(textDiff.action)}${text ? '' : ' (empty) '} text ${
              text ? `'${text}'` : ''
            }`
          )
        }
        annotation = <AnnotatedStringDiff diff={textDiff} />
      }
      if (isAddMark(cDiff, cSchemaType)) {
        const marks = cDiff.fields.marks.toValue
        summary.push(`Added mark ${(Array.isArray(marks) ? marks : []).join(', ')}`)
      }
      if (isAddAnnotation(cDiff, cSchemaType) || isRemoveAnnotation(cDiff, cSchemaType)) {
        const mark =
          (Array.isArray(cDiff.fields.marks.toValue) && cDiff.fields.marks.toValue[0]) || ''
        const type = (block.markDefs || []).find(def => def._key === mark)
        summary.push(`Added annotation to text '${child.text}' (${type ? type._type : 'unknown'})`)
      }
      if (isAddInlineObject(cDiff) || isChangeInlineObject(cDiff) || isRemoveInlineObject(cDiff)) {
        summary.push(`${startCase(cDiff.action)} inline object`)
        annotation = <InlineObject node={child} diff={cDiff} />
      }
    })

    if (childDiffs.length !== 0 && summary.length === 0) {
      summary.push(
        <span>
          Uknown diff:
          <br />
          <pre>{JSON.stringify(childDiffs, null, 2)}</pre>
        </span>
      )
    }

    childMap[child._key] = {
      annotation,
      diffs: childDiffs,
      child,
      schemaType: cSchemaType,
      summary
    }
  })
  return childMap
}

export function findChildDiffs(diff: ObjectDiff, child: PortableTextChild): ObjectDiff[] {
  const childrenDiff = diff.fields.children as ArrayDiff
  return childrenDiff.items
    .filter(
      item => item.diff.isChanged && (item.diff.toValue === child || item.diff.fromValue === child)
    )
    .map(item => item.diff)
    .map(childDiff => childDiff as ObjectDiff)
}

function isAddInlineObject(cDiff: ObjectDiff) {
  return (
    cDiff.type === 'object' &&
    cDiff.isChanged &&
    cDiff.action === 'added' &&
    cDiff.fromValue === undefined &&
    cDiff.toValue &&
    typeof cDiff.toValue === 'object' &&
    typeof cDiff.toValue._type === 'string' &&
    cDiff.toValue._type !== 'span'
  )
}

function isChangeInlineObject(cDiff: ObjectDiff) {
  return (
    cDiff.type === 'object' &&
    cDiff.isChanged &&
    cDiff.action === 'changed' &&
    cDiff.fromValue !== undefined &&
    cDiff.toValue &&
    typeof cDiff.toValue === 'object' &&
    typeof cDiff.toValue._type === 'string' &&
    cDiff.toValue._type !== 'span'
  )
}

function isRemoveInlineObject(cDiff: ObjectDiff) {
  return (
    cDiff.type === 'object' &&
    cDiff.isChanged &&
    cDiff.action === 'removed' &&
    cDiff.fromValue &&
    cDiff.toValue === undefined &&
    typeof cDiff.fromValue === 'object' &&
    typeof cDiff.fromValue._type === 'string' &&
    cDiff.fromValue._type !== 'span'
  )
}

function isAddMark(cDiff: ObjectDiff, cSchemaType?: SchemaType) {
  if (!cSchemaType) {
    return false
  }
  return (
    cDiff.fields.marks &&
    cDiff.fields.marks.isChanged &&
    cDiff.fields.marks.action === 'added' &&
    Array.isArray(cDiff.fields.marks.toValue) &&
    cDiff.fields.marks.toValue.length > 0 &&
    cSchemaType.jsonType === 'object' &&
    cDiff.fields.marks.toValue.every(
      mark => typeof mark === 'string' && cSchemaType && isDecorator(mark, cSchemaType)
    )
  )
}

function isAddAnnotation(cDiff: ObjectDiff, cSchemaType?: SchemaType) {
  if (!cSchemaType) {
    return false
  }
  return (
    cDiff.fields.marks &&
    cDiff.fields.marks.isChanged &&
    cDiff.fields.marks.action === 'added' &&
    Array.isArray(cDiff.fields.marks.toValue) &&
    cDiff.fields.marks.toValue.length > 0 &&
    cSchemaType.jsonType === 'object' &&
    cDiff.fields.marks.toValue.every(
      mark => typeof mark === 'string' && cSchemaType && !isDecorator(mark, cSchemaType)
    )
  )
}

function isRemoveAnnotation(cDiff: ObjectDiff, cSchemaType?: SchemaType) {
  if (!cSchemaType) {
    return false
  }
  return (
    cDiff.fields.marks &&
    cDiff.fields.marks.isChanged &&
    cDiff.fields.marks.action === 'removed' &&
    cSchemaType.jsonType === 'object' &&
    cDiff.fields.marks.fromValue &&
    Array.isArray(cDiff.fields.marks.fromValue) &&
    cDiff.fields.marks.fromValue.every(
      mark => typeof mark === 'string' && cSchemaType && !isDecorator(mark, cSchemaType)
    )
  )
}

function getChildSchemaType(fields: any[], child: PortableTextChild) {
  const childrenField = fields.find(f => f.name === 'children')
  const cSchemaType =
    (childrenField &&
      childrenField.type &&
      childrenField.type.jsonType === 'array' &&
      (childrenField.type.of.find(type => type.name === child._type) as ObjectSchemaType)) ||
    undefined
  return cSchemaType
}

export function diffDidRemove(blockDiff: ObjectDiff) {
  const childrenDiff = blockDiff.fields.children as ArrayDiff
  return (
    blockDiff.action === 'removed' ||
    (childrenDiff && childrenDiff.items.some(item => item.diff.action === 'removed'))
  )
}

export function getDecorators(spanSchemaType: SpanTypeSchema) {
  if (spanSchemaType.decorators) {
    return spanSchemaType.decorators
  }
  return []
}

export function isDecorator(name: string, schemaType: SpanTypeSchema) {
  return getDecorators(schemaType).some(dec => dec.value === name)
}
