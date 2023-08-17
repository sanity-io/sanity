import {flatten, isEqual, orderBy} from 'lodash'
import {
  ArraySchemaType,
  isPortableTextSpan,
  isPortableTextTextBlock,
  ObjectField,
  ObjectSchemaType,
  PortableTextBlock,
  PortableTextChild,
  PortableTextObject,
  PortableTextTextBlock,
  SchemaType,
  SpanSchemaType,
} from '@sanity/types'
import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  cleanupEfficiency,
  makeDiff,
} from '@sanity/diff-match-patch'
import {
  ArrayDiff,
  DiffComponent,
  DiffComponentOptions,
  ObjectDiff,
  StringDiffSegment,
} from '../../../types'
import * as TextSymbols from './symbols'

import {InlineSymbolMap, MarkSymbolMap, PortableTextDiff} from './types'

export const UNKNOWN_TYPE_NAME = '_UNKOWN_TYPE_'

export function hasPTMemberType(schemaType: ArraySchemaType): boolean {
  return schemaType.of.some(isPTSchemaType)
}

const startMarkSymbols = TextSymbols.DECORATOR_SYMBOLS.map((set) => set[0]).concat(
  TextSymbols.ANNOTATION_SYMBOLS.map((set) => set[0]),
)
const endMarkSymbols = TextSymbols.DECORATOR_SYMBOLS.map((set) => set[1]).concat(
  TextSymbols.ANNOTATION_SYMBOLS.map((set) => set[1]),
)
const allSymbols = startMarkSymbols
  .concat(endMarkSymbols)
  .concat(TextSymbols.INLINE_SYMBOLS)
  .concat(TextSymbols.CHILD_SYMBOL)
  .concat(TextSymbols.SEGMENT_START_SYMBOL)
const symbolRegex = new RegExp(`${allSymbols.join('|')}`, 'g')
const segmentRegex = new RegExp(`${allSymbols.join('|')}|\n`, 'g')

interface BlockSchemaType extends ObjectSchemaType {
  diffComponent:
    | DiffComponent<ObjectDiff<PortableTextBlock>>
    | DiffComponentOptions<ObjectDiff<PortableTextBlock>>
}

export function isPTSchemaType(schemaType: SchemaType): schemaType is BlockSchemaType {
  return schemaType.jsonType === 'object' && schemaType.name === 'block'
}

export function isHeader(node: PortableTextBlock): boolean {
  return (
    isPortableTextTextBlock(node) &&
    !!node.style &&
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.style)
  )
}

export function findChildDiff(diff: ObjectDiff, child: PortableTextChild): ObjectDiff {
  const childrenDiff = diff.fields.children as ArrayDiff
  return childrenDiff.items
    .filter(
      (item: any) =>
        item.diff.isChanged && (item.diff.toValue === child || item.diff.fromValue === child),
    )
    .map((item: any) => item.diff)
    .map((childDiff: any) => childDiff as ObjectDiff)[0]
}

export function getChildSchemaType(
  fields: ObjectField<SchemaType>[],
  child: PortableTextChild,
): ObjectSchemaType | undefined {
  const childrenField = fields.find((f) => f.name === 'children')
  const cSchemaType =
    (childrenField &&
      childrenField.type &&
      childrenField.type.jsonType === 'array' &&
      (childrenField.type.of.find((type) => type.name === child._type) as ObjectSchemaType)) ||
    undefined
  return cSchemaType
}

export function getDecorators(spanSchemaType: SpanSchemaType): {title: string; value: string}[] {
  if (spanSchemaType.decorators) {
    return orderBy(spanSchemaType.decorators, ['value'], ['asc'])
  }
  return []
}

export function getAnnotations(spanSchemaType: SpanSchemaType): ObjectSchemaType[] {
  if (spanSchemaType.annotations) {
    return orderBy(spanSchemaType.annotations, ['name'], ['asc'])
  }
  return []
}

export function isDecorator(name: string, schemaType: SpanSchemaType): boolean {
  return getDecorators(schemaType).some((dec) => dec.value === name)
}

export function blockToSymbolizedText(
  diff: ObjectDiff,
  block: PortableTextTextBlock | undefined,
  decoratorMap: MarkSymbolMap,
  annotationMap: MarkSymbolMap,
  inlineMap: InlineSymbolMap,
): string {
  if (!block) {
    return ''
  }
  return block.children
    .map((child) => {
      let returned = isPortableTextSpan(child) ? child.text?.replace(symbolRegex, '') : '' // Make sure symbols aren't in the text already
      if (isPortableTextSpan(child)) {
        // Attatch stringdiff segments
        const spanDiff = findSpanDiffFromChild(diff, child)
        const textDiff = spanDiff?.fields.text
        if (
          textDiff &&
          textDiff.toValue === child.text &&
          textDiff.type === 'string' &&
          textDiff.action !== 'unchanged'
        ) {
          returned = textDiff.segments
            .filter((seg) => seg.action !== 'removed')
            .map((seg) => seg.text.replace(symbolRegex, ''))
            .join(TextSymbols.SEGMENT_START_SYMBOL)
        }
        if (child.marks) {
          child.marks.forEach((mark) => {
            const _isDecorator = !!decoratorMap[mark]
            if (_isDecorator) {
              returned = `${decoratorMap[mark][0]}${returned}${decoratorMap[mark][1]}`
            } else if (annotationMap[mark]) {
              returned = `${annotationMap[mark][0]}${returned}${annotationMap[mark][1]}`
            }
          })
        }
      } else {
        returned = inlineMap[child._key]
      }
      return `${TextSymbols.CHILD_SYMBOL}${returned}`
    })
    .join('')
}

export function createPortableTextDiff(
  diff: ObjectDiff,
  schemaType: ObjectSchemaType,
): PortableTextDiff {
  const displayValue =
    diff.action === 'removed'
      ? (diff.fromValue as PortableTextTextBlock)
      : (diff.toValue as PortableTextTextBlock)
  const _diff: PortableTextDiff = {
    ...diff,
    origin: diff,
    displayValue,
  }

  if (displayValue) {
    const annotationMap: MarkSymbolMap = {}
    const decoratorMap: MarkSymbolMap = {}
    const inlineMap: InlineSymbolMap = {}
    const spanSchemaType = getChildSchemaType(schemaType.fields, {
      _key: 'bogus',
      _type: 'span',
    }) as SpanSchemaType
    if (spanSchemaType) {
      getDecorators(spanSchemaType).forEach((dec, index) => {
        decoratorMap[dec.value] = TextSymbols.DECORATOR_SYMBOLS[index]
      })
    }
    const allMarkDefs = getAllMarkDefs(_diff.origin)
    allMarkDefs.forEach((markDef, index) => {
      annotationMap[markDef._key] = TextSymbols.ANNOTATION_SYMBOLS[index]
    })
    const inlines = getInlineObjects(_diff.origin)
    inlines.forEach((inline, index) => {
      inlineMap[inline._key] = TextSymbols.INLINE_SYMBOLS[index]
    })
    const fromText = blockToSymbolizedText(
      _diff.origin,
      _diff.fromValue as PortableTextTextBlock,
      decoratorMap,
      annotationMap,
      inlineMap,
    )
    const toText = blockToSymbolizedText(
      _diff.origin,
      _diff.toValue as PortableTextTextBlock,
      decoratorMap,
      annotationMap,
      inlineMap,
    )
    const toPseudoValue = {
      ...displayValue,
      children: [
        {
          _type: 'span',
          _key: 'pseudoSpanKey',
          text: toText,
          marks: [],
        },
      ],
    }
    const fromPseudoValue = {
      displayValue,
      children: [
        {
          _type: 'span',
          _key: 'pseudoSpanKey',
          text: fromText,
          marks: [],
        },
      ],
    }
    const pseudoDiff = {
      origin: diff,
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
                    segments: buildSegments(fromText, toText).map((seg) => ({
                      ...seg,
                      ...(_diff.action !== 'unchanged' && _diff.annotation
                        ? {annotation: _diff.annotation} // Fallback if we can't find a spesific original diff
                        : {}),
                    })),
                  },
                },
                fromValue: fromPseudoValue.children[0],
                toValue: toPseudoValue.children[0],
              },
              annotation: null,
              fromIndex: 0,
              toIndex: 0,
              hasMoved: false,
            },
          ],
          fromValue: fromPseudoValue.children,
          toValue: toPseudoValue.children,
        },
      },
    }
    return pseudoDiff as PortableTextDiff
  }
  throw new Error('Can not display this diff')
}

function buildSegments(fromInput: string, toInput: string): StringDiffSegment[] {
  const segments: StringDiffSegment[] = []
  const dmpDiffs = cleanupEfficiency(makeDiff(fromInput, toInput))

  let fromIdx = 0
  let toIdx = 0
  for (const [op, text] of dmpDiffs) {
    switch (op) {
      case DIFF_EQUAL:
        segments.push({
          type: 'stringSegment',
          action: 'unchanged',
          text,
        })
        fromIdx += text.length
        toIdx += text.length
        break
      case DIFF_DELETE:
        segments.push({
          type: 'stringSegment',
          action: 'removed',
          text: fromInput.substring(fromIdx, fromIdx + text.length),
          annotation: null,
        })
        fromIdx += text.length
        break
      case DIFF_INSERT:
        segments.push({
          type: 'stringSegment',
          action: 'added',
          text: toInput.substring(toIdx, toIdx + text.length),
          annotation: null,
        })
        toIdx += text.length
        break
      default:
      // Do nothing
    }
  }
  // Clean up so that marks / symbols are treated as an own segment
  return flatten(
    segments.map((seg) => {
      const newSegments: StringDiffSegment[] = []
      if (seg.text.length > 1) {
        const markMatches = [...seg.text.matchAll(segmentRegex)]
        let lastIndex = -1
        markMatches.forEach((match) => {
          const index = match.index || 0
          if (index > lastIndex) {
            newSegments.push({...seg, text: seg.text.substring(lastIndex + 1, index)})
            newSegments.push({...seg, text: match[0]})
          }
          if (match === markMatches[markMatches.length - 1]) {
            newSegments.push({...seg, text: seg.text.substring(index + 1)})
          }
          lastIndex = index
        })
        if (markMatches.length === 0) {
          newSegments.push(seg)
        }
      } else {
        newSegments.push(seg)
      }
      return newSegments
    }),
  )
}

export function getInlineObjects(diff: ObjectDiff): PortableTextObject[] {
  const allChildren = [
    ...(diff.toValue ? diff.toValue.children.filter((cld: any) => cld._type !== 'span') : []),
  ]
  const previousChildren = diff.fromValue
    ? diff.fromValue.children.filter((cld: any) => cld._type !== 'span')
    : []
  previousChildren.forEach((oCld: any) => {
    if (!allChildren.some((cld) => oCld._key === cld._key)) {
      allChildren.push(oCld)
    }
  })
  return orderBy(allChildren, ['_key'], ['asc']) as PortableTextObject[]
}

export function findSpanDiffFromChild(
  diff: ObjectDiff,
  child: PortableTextChild,
): ObjectDiff | undefined {
  // Find span in original diff which has a string segment similar to the one from the input
  const candidate =
    diff.fields.children &&
    diff.fields.children.action !== 'unchanged' &&
    diff.fields.children.type === 'array' &&
    diff.fields.children.items.find(
      (item: any) =>
        item.diff &&
        item.diff.type === 'object' &&
        (item.diff.action === 'removed'
          ? item.diff.fromValue && item.diff.fromValue._key === child._key
          : (item.diff.toValue && item.diff.toValue._key) === child._key),
    )
  if (candidate) {
    return candidate.diff as ObjectDiff
  }
  return undefined
}

export function findAnnotationDiff(diff: ObjectDiff, markDefKey: string): ObjectDiff | undefined {
  return (
    ((diff.fields.markDefs &&
      diff.fields.markDefs.isChanged &&
      diff.fields.markDefs.type === 'array' &&
      diff.fields.markDefs.items.find(
        (item: any) =>
          item.diff &&
          item.diff.type === 'object' &&
          ((item.diff.toValue && item.diff.toValue._key && item.diff.toValue._key === markDefKey) ||
            (item.diff.fromValue &&
              item.diff.fromValue._key &&
              item.diff.fromValue._key === markDefKey)),
      )?.diff) as ObjectDiff) || undefined
  )
}

export function isEmptyObject(object: PortableTextChild): boolean {
  return (object && isEqual(Object.keys(object), ['_key', '_type'])) || false
}

export function escapeRegExp(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export function getAllMarkDefs(diff: ObjectDiff): PortableTextChild[] {
  const allDefs: PortableTextChild[] = [
    ...(diff.toValue && diff.toValue.markDefs ? diff.toValue.markDefs : []),
  ]
  const oldDefs: PortableTextChild[] =
    diff.fromValue && diff.fromValue.markDefs ? diff.fromValue.markDefs : []
  oldDefs.forEach((oDef) => {
    if (!allDefs.some((def) => oDef._key === def._key)) {
      allDefs.push(oDef)
    }
  })
  return orderBy(allDefs, ['_key'], ['asc'])
}
