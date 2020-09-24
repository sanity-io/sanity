import React, {useMemo} from 'react'
import {flatten, uniq} from 'lodash'
import {PortableTextBlock, PortableTextChild, PortableTextDiff, StringSegment} from '../types'
import {
  ANNOTATION_SYMBOLS,
  childIsSpan,
  createChildMap,
  getChildSchemaType,
  getDecorators,
  getInlineObjects,
  INLINE_SYMBOLS,
  isDecorator,
  MARK_SYMBOLS,
  UNKNOWN_TYPE_NAME
} from '../helpers'

import {ArrayDiff, DiffCard, ObjectDiff} from '../../../../diff'
import {ObjectSchemaType, SchemaType} from '../../../../types'

import Block from './Block'
import Annotation from './Annotation'
import Decorator from './Decorator'
import {InlineObject} from './InlineObject'

const markSymbolsFlattened = flatten(MARK_SYMBOLS)
const markSymbolsStart = MARK_SYMBOLS.map(set => set[0])
const markSymbolsEnd = MARK_SYMBOLS.map(set => set[1])
const annotationSymbolsStart = ANNOTATION_SYMBOLS.map(set => set[0])
const annotationSymbolsEnd = ANNOTATION_SYMBOLS.map(set => set[1])

type Props = {
  diff: PortableTextDiff
  schemaType: ObjectSchemaType
}

export default function PortableText(props: Props): JSX.Element {
  const {diff, schemaType} = props
  const childMap = useMemo(() => createChildMap(diff.origin, schemaType), [diff, schemaType])
  const block = diff.displayValue

  const inlineObjects = diff.toValue ? getInlineObjects(diff.toValue as PortableTextBlock) : []

  const renderObjectTypes = {}

  Object.keys(childMap)
    .map(key => childMap[key])
    .forEach(mapEntry => {
      const {child} = mapEntry
      if (!childIsSpan(child) && child._type) {
        renderObjectTypes[child._type] = renderInlineObject
      } else {
        // This should not happen at this point. But have a fallback for rendering missing types anyway.
        renderObjectTypes[UNKNOWN_TYPE_NAME] = renderInvalidInlineObjectType
      }
    })

  const renderChild = (child: PortableTextChild) => {
    const spanSchemaType = getChildSchemaType(schemaType.fields, child)
    let decoratorTypes: {title: string; value: string}[] = []
    if (spanSchemaType) {
      decoratorTypes = getDecorators(spanSchemaType)
      const childrenDiff = diff.fields.children as ArrayDiff
      const segments =
        (childrenDiff.items[0].diff &&
          childrenDiff.items[0].diff.type === 'object' &&
          childrenDiff.items[0].diff.fields.text.type === 'string' &&
          childrenDiff.items[0].diff.fields.text.segments) ||
        []
      const returnedChildren: any[] = []
      let activeMarks: string[] = []
      let removedMarks: string[] = []

      // TODO: clean up this complexity!
      segments.forEach(seg => {
        const isInline = INLINE_SYMBOLS.includes(seg.text)
        const isMarkStart =
          markSymbolsStart.includes(seg.text) || annotationSymbolsStart.includes(seg.text)
        const isMarkEnd =
          markSymbolsEnd.includes(seg.text) || annotationSymbolsEnd.includes(seg.text)
        if (isMarkStart) {
          const mark = markSymbolsFlattened.includes(seg.text[0])
            ? decoratorTypes[markSymbolsStart.indexOf(seg.text[0])]?.value
            : diff.toValue &&
              diff.toValue.markDefs[annotationSymbolsStart.indexOf(seg.text[0])]?._key
          if (seg.action === 'removed') {
            removedMarks.push(mark)
          } else {
            activeMarks.push(mark)
          }
        } else if (isMarkEnd) {
          if (seg.action === 'removed') {
            removedMarks = removedMarks.slice(0, -1)
          } else {
            activeMarks = activeMarks.slice(0, -1)
          }
        } else if (isInline) {
          const indexOfSymbol = INLINE_SYMBOLS.findIndex(sym => sym === seg.text)
          const key = inlineObjects[indexOfSymbol]?._key
          const originChild = diff.displayValue.children.find(
            cld => cld._key === key
          ) as PortableTextChild
          if (key) {
            const objectDiff = childMap[key]?.diff as ObjectDiff
            const objectSchemaType = childMap[key]?.schemaType as ObjectSchemaType
            if (!objectSchemaType) {
              throw new Error('Schema type required')
            }
            returnedChildren.push(
              renderInlineObject({
                child: originChild,
                diff: objectDiff,
                schemaType: objectSchemaType
              })
            )
          }
        } else if (seg.action === 'unchanged') {
          returnedChildren.push(
            renderWithMarks(diff, activeMarks, removedMarks, seg.text, spanSchemaType)
          )
        } else if (seg.action === 'removed') {
          const textDiffAnnotation = findTextAnnotationFromSegment(diff, seg)
          returnedChildren.push(
            <DiffCard
              annotation={textDiffAnnotation || seg.annotation}
              as="del"
              tooltip={{description: 'Removed text'}}
            >
              {renderWithMarks(diff, activeMarks, removedMarks, seg.text, spanSchemaType)}
            </DiffCard>
          )
        } else if (seg.action === 'added') {
          const textDiffAnnotation = findTextAnnotationFromSegment(diff, seg)
          returnedChildren.push(
            <DiffCard
              annotation={textDiffAnnotation || seg.annotation}
              as="ins"
              tooltip={{description: 'Added text'}}
            >
              {renderWithMarks(diff, activeMarks, removedMarks, seg.text, spanSchemaType)}
            </DiffCard>
          )
        }
      })
      return React.createElement('div', {key: block._key}, ...returnedChildren)
    }
    throw new Error("'span' schemaType not found")
  }

  function renderInvalidInlineObjectType() {
    return <span>Invalid inline object type</span>
  }

  return (
    <Block block={block} diff={diff}>
      {(diff.displayValue.children || []).map(child => renderChild(child))}
    </Block>
  )
}

function findTextAnnotationFromSegment(diff: ObjectDiff, segment: StringSegment) {
  const childrenDiff = diff.fields.children as ArrayDiff
  const childItem = childrenDiff.items.find(
    item =>
      item.diff.isChanged &&
      item.diff.type === 'object' &&
      item.diff.fields.text &&
      item.diff.fields.text.type === 'string' &&
      item.diff.fields.text.action !== 'unchanged' &&
      item.diff.fields.text.segments.find(seg => seg.text === segment.text)
  )
  if (
    childItem &&
    childItem.diff.type === 'object' &&
    childItem.diff.fields.text &&
    childItem.diff.fields.text.action !== 'unchanged'
  ) {
    return childItem.diff.fields.text.annotation
  }
  return undefined
}

function renderInlineObject(props: {
  child: PortableTextChild
  schemaType: ObjectSchemaType
  diff: ObjectDiff
}): React.ReactNode {
  const {child, diff, schemaType} = props
  const inlineObjectSchemaType = getChildSchemaType(schemaType.fields, child)
  return (
    <InlineObject
      key={`inline-object-${child._key}`}
      object={child}
      diff={diff}
      schemaType={inlineObjectSchemaType}
    />
  )
}

function renderWithMarks(
  diff: PortableTextDiff,
  activeMarks: string[],
  removedMarks: string[],
  text: string,
  spanSchemaType: SchemaType
): JSX.Element {
  if (text === '\n') {
    return <br />
  }
  let returned = <>{text}</>
  const allMarks = uniq([...activeMarks, ...removedMarks]).sort()
  if (allMarks.length) {
    allMarks.forEach(mark => {
      if (isDecorator(mark, spanSchemaType)) {
        returned = (
          <Decorator diff={diff.origin} mark={mark} text={text}>
            {returned}
          </Decorator>
        )
      } else {
        returned = (
          <Annotation diff={diff.origin} mark={mark}>
            {returned}
          </Annotation>
        )
      }
    })
  }
  return returned
}
