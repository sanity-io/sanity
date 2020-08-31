import React from 'react'
import {AnnotatedStringDiff, ArrayDiff, ObjectDiff, StringDiff} from '../../index'
import {startCase} from 'lodash'
import {ChildMap, PortableTextBlock, PortableTextChild} from './types'
import {SchemaType} from '../../types'

export function isPTSchemaType(schemaType: SchemaType) {
  return schemaType.jsonType === 'object' && schemaType.name === 'block'
}
export function isHeader(node: PortableTextBlock) {
  return !!node.style && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.style)
}

export function createChildMap(block: PortableTextBlock, blockDiff: ObjectDiff) {
  // Create a map from span to diff
  const childMap: ChildMap = {}
  block.children.forEach(child => {
    const childDiffs = findChildDiffs(blockDiff, child)
    let annotation
    const summary: React.ReactNode[] = []

    // Summarize all diffs to this child
    // eslint-disable-next-line complexity
    childDiffs.forEach(cDiff => {
      const textDiff = cDiff.fields.text as StringDiff
      if (textDiff && textDiff.isChanged) {
        if (textDiff.action === 'changed') {
          summary.push(`Changed '${textDiff.fromValue}' to  '${textDiff.toValue}'`)
        } else {
          const text = textDiff.toValue || textDiff.fromValue
          summary.push(`${startCase(textDiff.action)}${text ? '' : ' (empty) '} text '${text}'`)
        }
        annotation = <AnnotatedStringDiff diff={textDiff} />
      }
      if (
        cDiff.fields.marks &&
        cDiff.fields.marks.isChanged &&
        cDiff.fields.marks.action === 'added' &&
        Array.isArray(cDiff.fields.marks.toValue) &&
        cDiff.fields.marks.toValue.length > 0
      ) {
        const marks = cDiff.fields.marks.toValue
        summary.push(`Added mark ${(Array.isArray(marks) ? marks : []).join(', ')}`)
      }
    })

    if (childDiffs.length !== 0 && summary.length === 0) {
      summary.push(<pre>{`Unknown diff ${JSON.stringify(childDiffs, null, 2)}`}</pre>)
    }

    childMap[child._key] = {
      annotation,
      diffs: childDiffs,
      node: child,
      summary
    }
  })
  return childMap
}

function findChildDiffs(diff: ObjectDiff, child: PortableTextChild): ObjectDiff[] {
  const childrenDiff = diff.fields.children as ArrayDiff
  return childrenDiff.items
    .filter(item => item.diff.isChanged && item.diff.toValue === child)
    .map(item => item.diff)
    .map(childDiff => childDiff as ObjectDiff)
}
