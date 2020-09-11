import {startCase} from 'lodash'
import {ArrayDiff, ObjectDiff, StringDiff} from '../../../diff'
import {SchemaType, ObjectSchemaType} from '../../../types'
import {
  ChildMap,
  PortableTextBlock,
  PortableTextDiff,
  PortableTextChild,
  SpanTypeSchema
} from './types'

export const UNKNOWN_TYPE_NAME = '_UNKOWN_TYPE_'

export function isPTSchemaType(schemaType: SchemaType): boolean {
  return schemaType.jsonType === 'object' && schemaType.name === 'block'
}
export function isHeader(node: PortableTextBlock): boolean {
  return !!node.style && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.style)
}

export function createChildMap(
  blockDiff: PortableTextDiff,
  schemaType: ObjectSchemaType
): ChildMap {
  // Create a map from span to diff
  const block = blockDiff.displayValue
  // Add removed children
  const childMap: ChildMap = {}
  const children = block.children || []
  // eslint-disable-next-line complexity
  children.forEach(child => {
    const summary: string[] = []
    // Fallback type for renderer (unkown types)
    if (typeof child !== 'object' || typeof child._type !== 'string') {
      child._type = UNKNOWN_TYPE_NAME
    }
    const cSchemaType = getChildSchemaType(schemaType.fields, child)
    const cDiff = findChildDiff(blockDiff, child)

    if (cDiff) {
      const textDiff = cDiff.fields.text as StringDiff
      if (textDiff && textDiff.isChanged) {
        // eslint-disable-next-line max-depth
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
      }
    }
    if (cDiff && summary.length === 0) {
      summary.push(`Unkown diff ${JSON.stringify(cDiff)}`)
    }

    childMap[child._key] = {
      diff: cDiff,
      child,
      schemaType: cSchemaType,
      summary
    }
  })
  return childMap
}

export function findChildDiff(diff: ObjectDiff, child: PortableTextChild): ObjectDiff {
  const childrenDiff = diff.fields.children as ArrayDiff
  return childrenDiff.items
    .filter(
      item => item.diff.isChanged && (item.diff.toValue === child || item.diff.fromValue === child)
    )
    .map(item => item.diff)
    .map(childDiff => childDiff as ObjectDiff)[0]
}

function isAddInlineObject(cDiff: ObjectDiff) {
  return (
    cDiff.type === 'object' &&
    cDiff.isChanged &&
    cDiff.action === 'added' &&
    cDiff.fromValue === undefined &&
    !childIsSpan(cDiff.toValue as PortableTextChild)
  )
}

function isChangeInlineObject(cDiff: ObjectDiff) {
  return (
    cDiff.type === 'object' &&
    cDiff.isChanged &&
    cDiff.action === 'changed' &&
    cDiff.fromValue !== undefined &&
    !childIsSpan(cDiff.toValue as PortableTextChild)
  )
}

function isRemoveInlineObject(cDiff: ObjectDiff) {
  return (
    cDiff.type === 'object' &&
    cDiff.isChanged &&
    cDiff.action === 'removed' &&
    cDiff.toValue === undefined &&
    !childIsSpan(cDiff.fromValue as PortableTextChild)
  )
}

export function isAddMark(cDiff: ObjectDiff, cSchemaType?: SchemaType): boolean {
  if (!cSchemaType) {
    return false
  }
  return !!(
    cDiff.fields.marks &&
    cDiff.fields.marks.isChanged &&
    cDiff.fields.marks.action === 'added' &&
    Array.isArray(cDiff.fields.marks.toValue) &&
    cDiff.fields.marks.toValue.length > 0 &&
    cSchemaType.jsonType === 'object' &&
    cDiff.fields.marks.toValue.some(
      mark => typeof mark === 'string' && cSchemaType && isDecorator(mark, cSchemaType)
    )
  )
}

export function isRemoveMark(cDiff: ObjectDiff, cSchemaType?: SchemaType): boolean {
  if (!cSchemaType) {
    return false
  }
  return !!(
    cDiff.fields.marks &&
    cDiff.fields.marks.isChanged &&
    cDiff.fields.marks.action === 'removed' &&
    Array.isArray(cDiff.fields.marks.fromValue) &&
    cDiff.fields.marks.fromValue.some(
      mark => typeof mark === 'string' && cSchemaType && isDecorator(mark, cSchemaType)
    )
  )
}

function isAddAnnotation(cDiff: ObjectDiff, cSchemaType?: SchemaType): boolean {
  if (!cSchemaType) {
    return false
  }
  return !!(
    cDiff.fields.marks &&
    cDiff.fields.marks.isChanged &&
    cDiff.fields.marks.action === 'added' &&
    Array.isArray(cDiff.fields.marks.toValue) &&
    cDiff.fields.marks.toValue.length > 0 &&
    cSchemaType.jsonType === 'object' &&
    cDiff.fields.marks.toValue.some(
      mark => typeof mark === 'string' && cSchemaType && !isDecorator(mark, cSchemaType)
    )
  )
}

function isRemoveAnnotation(cDiff: ObjectDiff, cSchemaType?: SchemaType): boolean {
  if (!cSchemaType) {
    return false
  }
  return !!(
    cDiff.fields.marks &&
    cDiff.fields.marks.isChanged &&
    cDiff.fields.marks.action === 'removed' &&
    cSchemaType.jsonType === 'object' &&
    cDiff.fields.marks.fromValue &&
    Array.isArray(cDiff.fields.marks.fromValue) &&
    typeof cDiff.fields.marks.toValue !== 'undefined' &&
    cDiff.fields.marks.fromValue.some(
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

export function diffDidRemove(blockDiff: ObjectDiff): boolean {
  return blockDiff.action === 'removed'
}

export function getDecorators(spanSchemaType: SpanTypeSchema): {title: string; value: string}[] {
  if (spanSchemaType.decorators) {
    return spanSchemaType.decorators
  }
  return []
}

export function isDecorator(name: string, schemaType: SpanTypeSchema): boolean {
  return getDecorators(schemaType).some(dec => dec.value === name)
}

export function childIsSpan(child: PortableTextChild): boolean {
  const isObject = typeof child === 'object'
  return isObject && typeof child._type === 'string' && child._type === 'span'
}

export function didChangeMarksOnly(diff: ObjectDiff): boolean {
  const from = blockToText(diff.fromValue as PortableTextBlock)
  const to = blockToText(diff.toValue as PortableTextBlock)
  const childrenDiff = diff.fields.children as ArrayDiff
  const hasMarkDiffs =
    !!childrenDiff &&
    childrenDiff.items.every(
      item => item.diff.isChanged && item.diff.type === 'object' && item.diff.fields.marks
    )
  return from === to && hasMarkDiffs
}

export function marksAreChangedByAction(
  diff: ObjectDiff,
  action: 'added' | 'removed' | 'changed'
): boolean {
  const childrenDiff = diff.fields.children as ArrayDiff
  const hasMarkDiffs =
    !!childrenDiff &&
    childrenDiff.items.some(
      item =>
        item.diff.isChanged &&
        item.diff.type === 'object' &&
        item.diff.fields.marks &&
        item.diff.fields.marks.action === action
    )
  return hasMarkDiffs
}

export function blockToText(block: PortableTextBlock | undefined | null): string {
  if (!block) {
    return ''
  }
  return block.children.map(child => child.text || '').join('')
}

export function prepareDiffForPortableText(diff: ObjectDiff): PortableTextDiff {
  const _diff: PortableTextDiff = {
    ...diff,
    displayValue:
      diff.action === 'removed'
        ? (diff.fromValue as PortableTextBlock)
        : (diff.toValue as PortableTextBlock)
  } // Make a copy so we don't manipulate the original diff object

  // Add children that are removed to the display value
  if (_diff.action !== 'removed') {
    const childrenDiff = _diff.fields.children as ArrayDiff
    const newChildren = [...(_diff?.toValue?.children || [])] as PortableTextChild[]
    const removedChildrenDiffs =
      (childrenDiff &&
        childrenDiff.items.filter(item => item.diff && item.diff.action === 'removed')) ||
      []
    removedChildrenDiffs.forEach(rDiff => {
      if (rDiff.fromIndex !== undefined) {
        const fromValue = rDiff.diff.fromValue as PortableTextChild
        if (fromValue._key) {
          newChildren.splice(rDiff.fromIndex + 1, 0, fromValue)
        }
      }
    })
    _diff.displayValue = {..._diff.toValue, children: newChildren} as PortableTextBlock
  }
  // Special condition when the only change is adding marks (then just remove all the other diffs - like created new spans)
  const onlyMarksAreChanged = didChangeMarksOnly(_diff)
  if (onlyMarksAreChanged) {
    const childrenItem = _diff.fields.children
    if (childrenItem && childrenItem.type === 'array') {
      childrenItem.items.forEach(item => {
        if (item.diff.type === 'object') {
          const itemDiff = item.diff as ObjectDiff
          Object.keys(itemDiff.fields).forEach(key => {
            if (key !== 'marks') {
              delete itemDiff.fields[key]
            }
          })
        }
      })
    }
  }

  // EXPERIMENTAL APPROACH TO BETTER SHOW DECORATOR CHANGES WHEN
  // THERE ARE ALSO CHANGES IN THE TEXT.

  // else if (marksAreChangedByAction(_diff, 'added') && _diff.toValue) {
  //   console.log('Marks added, but there is more!')
  //   // Is child split to add new span with mark?
  //   const block = _diff.toValue as PortableTextBlock
  //   // Find the span which has an added mark
  //   const childrenDiff = _diff.fields.children as ArrayDiff
  //   // console.log(
  //   //   JSON.stringify(
  //   //     childrenDiff.items.map(item => item.diff),
  //   //     null,
  //   //     2
  //   //   )
  //   // )
  //   const addMarkItems = childrenDiff.items.filter(
  //     item =>
  //       item.diff.isChanged &&
  //       item.diff.type === 'object' &&
  //       item.diff.fields.marks &&
  //       item.diff.fields.marks.toValue &&
  //       Array.isArray(item.diff.fields.marks.toValue) &&
  //       item.diff.fields.marks.toValue.length > 0
  //   )
  //   console.log('diff', _diff)
  //   console.log('addMarkItems', addMarkItems)
  //   // eslint-disable-next-line complexity
  //   addMarkItems.forEach(item => {
  //     const span = item.diff.toValue as PortableTextChild
  //     let spanBeforeDiff
  //     if (span) {
  //       const spanIndex = block.children.findIndex(child => child._key === span._key)
  //       const spanBefore = block.children[spanIndex - 1]
  //       if (spanBefore) {
  //         // Remove the text diff segment that is removed from the spanBefore but exists on the current span
  //         const spanDiff = childrenDiff.items.find(i => i.diff.toValue === spanBefore)?.diff
  //         // eslint-disable-next-line max-depth
  //         if (spanDiff) {
  //           const textDiff =
  //             spanDiff.type === 'object' &&
  //             !!spanDiff.fields.text &&
  //             spanDiff.fields.text.type === 'string' &&
  //             spanDiff.fields.text
  //           // eslint-disable-next-line max-depth
  //           if (textDiff && textDiff.segments[textDiff.segments.length - 1].action === 'removed') {
  //             spanBeforeDiff = textDiff
  //             textDiff.segments = textDiff.segments.slice(0, textDiff.segments.length - 1)
  //           }
  //         }
  //       } else if (
  //         item.diff.type === 'object' &&
  //         item.diff.fields.text &&
  //         item.diff.fields.text.type === 'string'
  //       ) {
  //         item.diff.fields.text.segments = item.diff.fields.text.segments.filter(
  //           segment => segment.action !== 'removed'
  //         )
  //       }
  //       const spanAfter = block.children[spanIndex + 1]
  //       if (spanAfter) {
  //         // Remove the text diff segment that is removed from the spanBefore but exists on the current span
  //         const spanDiff = childrenDiff.items.find(i => i.diff.toValue === spanAfter)?.diff
  //         // eslint-disable-next-line max-depth
  //         if (spanDiff) {
  //           const textDiff =
  //             spanDiff.type === 'object' &&
  //             !!spanDiff.fields.text &&
  //             spanDiff.fields.text.type === 'string' &&
  //             spanDiff.fields.text
  //           // eslint-disable-next-line max-depth
  //           if (textDiff && textDiff.segments[textDiff.segments.length - 1].action === 'added') {
  //             // eslint-disable-next-line max-depth
  //             if (
  //               spanBeforeDiff &&
  //               textDiff.segments.length === 1 &&
  //               textDiff.segments[0].action === 'added' &&
  //               spanBeforeDiff.fromValue.indexOf(
  //                 textDiff.segments[textDiff.segments.length - 1].text
  //               ) > -1 &&
  //               spanBeforeDiff.fromValue.substring(
  //                 spanBeforeDiff.fromValue.indexOf(
  //                   textDiff.segments[textDiff.segments.length - 1].text
  //                 )
  //               ) === textDiff.segments[textDiff.segments.length - 1].text
  //             ) {
  //               textDiff.segments[textDiff.segments.length - 1].action = 'unchanged'
  //             } else {
  //               // Diff what's changed here!
  //               console.log('diffing what is changed in the spanAfter', textDiff.segments)
  //               console.log('spanBeforeDiff', spanBeforeDiff)
  //               const blockFromValueText = blockToText(_diff.fromValue as PortableTextBlock)
  //               const blockToValueText = blockToText(_diff.toValue as PortableTextBlock)
  //               console.log('Value before:', blockFromValueText)
  //               console.log('Value now:', blockToValueText)
  //               // textDiff.segments = textDiff.segments.filter(seg => {
  //               //   seg.text
  //               // })
  //             }
  //           }
  //         }
  //       }
  //     }
  //   })
  // }
  return _diff as PortableTextDiff
}
