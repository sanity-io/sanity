import {flatten, startCase, orderBy} from 'lodash'
import {Block, SchemaType} from '@sanity/types'
import {
  diff_match_patch as DiffMatchPatch,
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT
} from 'diff-match-patch'
import {ArrayDiff, ObjectDiff, StringDiff} from '../../../diff'
import {ObjectSchemaType, ArraySchemaType} from '../../../types'
import {
  ChildMap,
  MarkSymbolMap,
  PortableTextBlock,
  PortableTextDiff,
  PortableTextChild,
  StringSegment,
  SpanTypeSchema
} from './types'

const dmp = new DiffMatchPatch()

export const UNKNOWN_TYPE_NAME = '_UNKOWN_TYPE_'

export function hasPTMemberType(schemaType: ArraySchemaType): boolean {
  return schemaType.of.some(isPTSchemaType)
}
export const MARK_SYMBOLS = [
  // [startTag, endTag]
  ['\uF000', '\uF001'],
  ['\uF002', '\uF003'],
  ['\uF004', '\uF005'],
  ['\uF006', '\uF007'],
  ['\uF008', '\uF009'],
  ['\uF00A', '\uF00B'],
  ['\uF00C', '\uF00D'],
  ['\uF00F', '\uF010'],
  ['\uF011', '\uF012'],
  ['\uF013', '\uF014'],
  ['\uF015', '\uF016'],
  ['\uF017', '\uF018'],
  ['\uF019', '\uF01A'],
  ['\uF01B', '\uF01C'],
  ['\uF01E', '\uF01F'],
  ['\uF020', '\uF021']
]

export const ANNOTATION_SYMBOLS = [
  // [startTag, endTag]
  ['\uF050', '\uF051'],
  ['\uF052', '\uF053'],
  ['\uF054', '\uF055'],
  ['\uF056', '\uF057'],
  ['\uF058', '\uF059'],
  ['\uF05A', '\uF05B'],
  ['\uF05C', '\uF05D'],
  ['\uF05F', '\uF060'],
  ['\uF061', '\uF062'],
  ['\uF063', '\uF064'],
  ['\uF065', '\uF066'],
  ['\uF067', '\uF068'],
  ['\uF069', '\uF06A'],
  ['\uF06B', '\uF06C'],
  ['\uF06E', '\uF06F'],
  ['\uF070', '\uF071']
]

const startMarkSymbols = MARK_SYMBOLS.map(set => set[0]).concat(
  ANNOTATION_SYMBOLS.map(set => set[0])
)
const endMarkSymbols = MARK_SYMBOLS.map(set => set[1]).concat(ANNOTATION_SYMBOLS.map(set => set[1]))
const allSymbols = startMarkSymbols.concat(endMarkSymbols)
const markRegex = new RegExp(`${allSymbols.join('|')}`, 'g')

export function isPTSchemaType(schemaType: SchemaType): schemaType is ObjectSchemaType<Block> {
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

export function getChildSchemaType(fields: any[], child: PortableTextChild) {
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
    return orderBy(spanSchemaType.decorators, ['value'], ['asc'])
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

export function blockToSymbolizedText(
  block: PortableTextBlock | undefined | null,
  decoratorMap: MarkSymbolMap,
  annotationMap: MarkSymbolMap
): string {
  if (!block) {
    return ''
  }
  return block.children
    .map(child => {
      let returned = child.text || ''
      if (child._type !== 'span') {
        returned = `<inlineObject key='${child._key}'/>`
      } else if (child.marks) {
        child.marks.forEach(mark => {
          const _isDecorator = !!decoratorMap[mark]
          if (_isDecorator) {
            returned = `${decoratorMap[mark][0]}${returned}${decoratorMap[mark][1]}`
          } else if (annotationMap[mark]) {
            returned = `${annotationMap[mark][0]}${returned}${annotationMap[mark][1]}`
          }
        })
      }
      return returned
    })
    .join('')
}

// eslint-disable-next-line complexity
export function prepareDiffForPortableText(
  diff: ObjectDiff,
  schemaType: ObjectSchemaType
): [PortableTextDiff, PortableTextDiff | undefined] {
  const _diff: PortableTextDiff = {
    ...diff,
    displayValue:
      diff.action === 'removed'
        ? (diff.fromValue as PortableTextBlock)
        : (diff.toValue as PortableTextBlock)
  }

  if (_diff.fromValue && _diff.toValue) {
    const annotationMap: MarkSymbolMap = {}
    const markMap: MarkSymbolMap = {}
    const spanSchemaType = getChildSchemaType(schemaType.fields, {_key: 'bogus', _type: 'span'})
    if (spanSchemaType) {
      getDecorators(spanSchemaType).forEach((dec, index) => {
        markMap[dec.value] = MARK_SYMBOLS[index]
      })
    }
    _diff.toValue.markDefs.forEach((markDef, index) => {
      annotationMap[markDef._key] = ANNOTATION_SYMBOLS[index]
    })
    const fromText = blockToSymbolizedText(
      _diff.fromValue as PortableTextBlock,
      markMap,
      annotationMap
    )
    const toText = blockToSymbolizedText(_diff.toValue as PortableTextBlock, markMap, annotationMap)
    const toPseudoValue = {
      ..._diff.displayValue,
      children: [
        {
          _type: 'span',
          _key: 'pseudoSpanKey',
          text: toText,
          marks: []
        }
      ]
    }
    const fromPseudoValue = {
      ..._diff.displayValue,
      children: [
        {
          _type: 'span',
          _key: 'pseudoSpanKey',
          text: fromText,
          marks: []
        }
      ]
    }
    const pseudoDiff = {
      action: 'changed',
      type: 'object',
      displayValue: toPseudoValue,
      fromValue: fromPseudoValue,
      toValue: toPseudoValue,
      isChanged: true,
      fields: {
        children: {
          action: 'changed',
          type: 'array',
          isChanged: true,
          items: [
            {
              diff: {
                action: 'changed',
                type: 'object',
                isChanged: true,
                fields: {
                  text: {
                    type: 'string',
                    action: 'changed',
                    isChanged: true,
                    fromValue: fromText,
                    toValue: toText,
                    segments: buildSegments(fromText, toText).map(seg => ({
                      ...seg,
                      ...(_diff.action !== 'unchanged' && _diff.annotation
                        ? {annotation: _diff.annotation} // Fallback // TODO:; this is a no-no
                        : {})
                    }))
                  }
                },
                fromValue: fromPseudoValue.children[0],
                toValue: toPseudoValue.children[0]
              },
              annotation: null,
              fromIndex: 0,
              toIndex: 0,
              hasMoved: false
            }
          ],
          fromValue: fromPseudoValue.children,
          toValue: toPseudoValue.children
        }
      }
    }
    return [_diff, pseudoDiff as PortableTextDiff]
  }
  return [_diff as PortableTextDiff, undefined]
}

function buildSegments(fromInput: string, toInput: string): StringSegment[] {
  const segments: StringSegment[] = []

  const dmpDiffs = dmp.diff_main(fromInput, toInput)
  dmp.diff_cleanupEfficiency(dmpDiffs)

  let fromIdx = 0
  let toIdx = 0

  for (const [op, text] of dmpDiffs) {
    switch (op) {
      case DIFF_EQUAL:
        segments.push({
          type: 'stringSegment',
          action: 'unchanged',
          text
        })
        fromIdx += text.length
        toIdx += text.length
        break
      case DIFF_DELETE:
        segments.push({
          type: 'stringSegment',
          action: 'removed',
          text: fromInput.substring(fromIdx, fromIdx + text.length)
        })
        fromIdx += text.length
        break
      case DIFF_INSERT:
        segments.push({
          type: 'stringSegment',
          action: 'added',
          text: toInput.substring(toIdx, toIdx + text.length)
        })
        toIdx += text.length
        break
      default:
      // Do nothing
    }
  }
  // Clean up so that marks / symbols are treated as an own segment
  return flatten(
    segments.map(seg => {
      const newSegments: StringSegment[] = []
      if (seg.text.length > 1) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // TODO: officially support string.matchAll or rewrite this!
        const markMatches = [...seg.text.matchAll(markRegex)]
        let lastIndex = -1
        markMatches.forEach(match => {
          if (match.index > lastIndex) {
            newSegments.push({...seg, text: seg.text.substring(lastIndex + 1, match.index)})
            newSegments.push({...seg, text: match[0]})
          }
          if (match === markMatches[markMatches.length - 1]) {
            newSegments.push({...seg, text: seg.text.substring(match.index + 1)})
          }
          lastIndex = match.index
        })
        if (markMatches.length === 0) {
          newSegments.push(seg)
        }
      } else {
        newSegments.push(seg)
      }
      return newSegments
    })
  )
}
