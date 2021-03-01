import React, {ReactElement} from 'react'
import {startCase, uniq, xor} from 'lodash'
import {ArrayDiff, DiffCard, ObjectDiff, StringDiff, StringDiffSegment} from '../../../../diff'

import {ObjectSchemaType, SchemaType} from '../../../../types'
import {PortableTextBlock, PortableTextChild, PortableTextDiff, SpanTypeSchema} from '../types'

import * as TextSymbols from '../symbols'

import {
  escapeRegExp,
  getAllMarkDefs,
  findChildDiff,
  findAnnotationDiff,
  findSpanDiffFromChild,
  getChildSchemaType,
  getDecorators,
  getInlineObjects,
  isDecorator,
} from '../helpers'

import Block from './Block'
import {Annotation} from './Annotation'
import Decorator from './Decorator'
import {InlineObject} from './InlineObject'
import {Text} from './Text'

const decoratorSymbolsStart = TextSymbols.DECORATOR_SYMBOLS.map((set) => set[0])
const decoratorSymbolsEnd = TextSymbols.DECORATOR_SYMBOLS.map((set) => set[1])
const annotationSymbolsStart = TextSymbols.ANNOTATION_SYMBOLS.map((set) => set[0])
const annotationSymbolsEnd = TextSymbols.ANNOTATION_SYMBOLS.map((set) => set[1])

const allSymbolsStart = decoratorSymbolsStart.concat(annotationSymbolsStart)
const allSymbolsEnd = decoratorSymbolsEnd.concat(annotationSymbolsEnd)

const allDecoratorSymbols = decoratorSymbolsStart.concat(decoratorSymbolsEnd)
const markRegex = new RegExp(`${allDecoratorSymbols.concat(allSymbolsEnd).join('|')}`, 'g')

type Props = {
  diff: PortableTextDiff
  schemaType: ObjectSchemaType
}

export default function PortableText(props: Props): JSX.Element {
  const {diff, schemaType} = props
  const block = (diff.origin.toValue || diff.origin.fromValue) as PortableTextBlock

  const inlineObjects = diff.origin.toValue ? getInlineObjects(diff.origin) : []

  const renderChild = (ptDiffChild: PortableTextChild) => {
    const spanSchemaType = getChildSchemaType(schemaType.fields, ptDiffChild) as SpanTypeSchema
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
      const returnedChildren: React.ReactNode[] = []
      const annotationSegments: Record<string, React.ReactNode[]> = {}
      // Special case for new empty PT-block (single span child with empty text)
      if (
        isEmptyTextChange(block, diff) &&
        (diff.origin.action === 'added' || diff.origin.action === 'removed')
      ) {
        const textDiff = findChildDiff(diff.origin, block.children[0]) || diff.origin
        if (textDiff && textDiff.action !== 'unchanged') {
          return (
            <DiffCard
              annotation={textDiff.annotation}
              as={textDiff.action === 'removed' ? 'del' : 'ins'}
              key={`empty-block-${block._key}`}
              tooltip={{
                description: `${startCase(textDiff.action)} empty text`,
              }}
            >
              <span>{TextSymbols.EMPTY_BLOCK_SYMBOL}</span>
            </DiffCard>
          )
        }
      }
      // Run through all the segments from the PortableTextDiff
      let childToIndex = -1
      let segIndex = -1
      const activeAnnotations: {mark: string; object: PortableTextChild; symbols: string[]}[] = []
      let endedAnnotation
      const allMarkDefs = getAllMarkDefs(diff.origin)
      segments.forEach((seg) => {
        segIndex++
        const isInline = TextSymbols.INLINE_SYMBOLS.includes(seg.text)
        const isMarkStart = allSymbolsStart.includes(seg.text)
        const isMarkEnd = allSymbolsEnd.includes(seg.text)
        const isChildStart = seg.text === TextSymbols.CHILD_SYMBOL
        const isRemoved = seg.action === 'removed'
        if (isChildStart) {
          if (!isRemoved) {
            childToIndex++
          }
          // No output
        } else if (isMarkStart || isMarkEnd) {
          if (isMarkStart && annotationSymbolsStart.includes(seg.text)) {
            const object = allMarkDefs[annotationSymbolsStart.indexOf(seg.text)]
            if (object) {
              activeAnnotations.push({
                mark: object._key,
                symbols: [seg.text, annotationSymbolsEnd[annotationSymbolsStart.indexOf(seg.text)]],
                object,
              })
            }
          }
          if (isMarkEnd && annotationSymbolsEnd.includes(seg.text)) {
            endedAnnotation = activeAnnotations.pop()
          }
          // No output
        } else if (isInline) {
          // Render inline object
          const indexOfSymbol = TextSymbols.INLINE_SYMBOLS.findIndex((sym) => sym === seg.text)
          const key = inlineObjects[indexOfSymbol]?._key
          const originChild = inlineObjects[indexOfSymbol]
          if (key) {
            const objectSchemaType = getChildSchemaType(schemaType.fields, originChild)
            const objectDiff = findChildDiff(diff.origin, originChild)
            returnedChildren.push(
              <InlineObject
                key={`inline-object-${originChild._key}`}
                object={originChild}
                path={[{_key: block._key}, 'children', {_key: originChild._key}]}
                diff={objectDiff}
                schemaType={objectSchemaType}
              />
            )
          }
        } else if (seg.text) {
          // TODO: find a better way of getting a removed child
          const getChildFromFromValue = () =>
            diff.origin.fromValue?.children.find(
              (cld) => cld.text && cld.text.match(escapeRegExp(seg.text))
            ) as PortableTextChild
          const child = block.children[childToIndex] || getChildFromFromValue()
          const childDiff = child && findSpanDiffFromChild(diff.origin, child)
          if (!child) {
            throw new Error('Could not find child')
          }
          const textDiff = childDiff?.fields?.text
            ? (childDiff?.fields?.text as StringDiff)
            : undefined
          const text = (
            <Text
              diff={textDiff}
              key={`text-${child._key}-${segIndex}`}
              path={[{_key: block._key}, 'children', {_key: child._key}]}
              childDiff={childDiff}
              segment={seg}
            >
              {renderTextSegment({
                diff,
                child,
                decoratorTypes,
                seg,
                segIndex,
                spanSchemaType,
              })}
            </Text>
          )

          // Render annotations text changes within the annotation child
          if (activeAnnotations.length > 0) {
            activeAnnotations.forEach((active) => {
              annotationSegments[active.mark] = annotationSegments[active.mark] || []
              annotationSegments[active.mark].push(text)
            })
          }
          if (endedAnnotation) {
            const key = `annotation-${endedAnnotation.object._key}`
            const lastChild = returnedChildren[returnedChildren.length - 1] as ReactElement
            if (lastChild && lastChild.key !== key) {
              const annotationDiff = findAnnotationDiff(diff.origin, endedAnnotation.mark)
              const objectSchemaType =
                endedAnnotation &&
                spanSchemaType.annotations &&
                spanSchemaType.annotations.find(
                  (type) =>
                    endedAnnotation &&
                    endedAnnotation.object &&
                    type.name === endedAnnotation.object._type
                )
              returnedChildren.push(
                <Annotation
                  object={endedAnnotation.object}
                  diff={annotationDiff}
                  path={[{_key: block._key}, 'children', {_key: child._key}]}
                  schemaType={objectSchemaType}
                  key={key}
                >
                  <>{annotationSegments[endedAnnotation.mark]}</>
                </Annotation>
              )
            }
            // delete annotationSegments[endedAnnotation.mark]
            endedAnnotation = undefined
          }
          if (activeAnnotations.length === 0) {
            returnedChildren.push(text)
          }
        } // end if seg.text
      })
      return React.createElement('div', {key: block._key}, ...returnedChildren)
    }
    throw new Error("'span' schemaType not found")
  }

  return (
    <Block block={diff.displayValue} diff={diff}>
      {<>{(diff.displayValue.children || []).map((child) => renderChild(child))}</>}
    </Block>
  )
}

function renderTextSegment({
  diff,
  child,
  decoratorTypes,
  seg,
  segIndex,
  spanSchemaType,
}: {
  diff: PortableTextDiff
  child: PortableTextChild
  decoratorTypes: {title: string; value: string}[]
  seg: StringDiffSegment
  segIndex: number
  spanSchemaType: SpanTypeSchema
}): JSX.Element {
  // Newlines
  if (seg.text === '\n') {
    return <br />
  }
  // Make sure we render trailing spaces correctly
  let children = (
    <span key={`text-${segIndex}`}>
      {seg.text.replace(/ /g, TextSymbols.TRAILING_SPACE_SYMBOL)}
    </span>
  )
  const spanDiff = child && findSpanDiffFromChild(diff.origin, child)
  // Render decorator diff info
  const activeMarks = child.marks || []
  if (spanDiff) {
    children = renderDecorators({
      activeMarks,
      decoratorTypes,
      diff,
      children,
      seg,
      segIndex,
      spanDiff,
      spanSchemaType,
    })
  }
  // Render the segment with the active marks
  if (activeMarks && activeMarks.length > 0) {
    activeMarks.forEach((mark) => {
      if (isDecorator(mark, spanSchemaType)) {
        children = (
          // eslint-disable-next-line react/no-array-index-key
          <Decorator mark={mark} key={`decorator-${mark}-${child._key}-${segIndex}`}>
            {children}
          </Decorator>
        )
      }
    })
  }
  return children
}

function renderDecorators({
  activeMarks,
  decoratorTypes,
  diff,
  children,
  seg,
  segIndex,
  spanDiff,
  spanSchemaType,
}: {
  activeMarks: string[]
  decoratorTypes: {title: string; value: string}[]
  diff: PortableTextDiff
  children: JSX.Element
  seg: StringDiffSegment
  segIndex: number
  spanDiff: ObjectDiff
  spanSchemaType: SchemaType
}): JSX.Element {
  let returned = <span key={`text-segment-${segIndex}`}>{children}</span>
  const fromPtDiffText =
    (diff.origin.fromValue && diff.fromValue && diff.fromValue.children[0].text) || '' // Always one child

  // There are cases where we have changed marks, but it's an indirect change in the diff data.
  // For example when '<>normal-text</><>bold-text</>' and 'bold' is unbolded. Then 'bold' is added to first span,
  // and 'bold' is removed from the second span: '<>normal-text-bold</><>-text</>'. No marks are changed.
  // We do however want to indicate to the user that someone removed bold from 'bold'
  // In these cases, fallback to the diff annotation information in the span itself.
  const indirectMarksAnnotation =
    (spanDiff && spanDiff.action !== 'unchanged' && spanDiff.annotation) || undefined

  const marksDiff = spanDiff?.fields?.marks as ArrayDiff
  const marksAnnotation =
    (marksDiff && marksDiff.action !== 'unchanged' && marksDiff.annotation) ||
    indirectMarksAnnotation

  let marksChanged: string[] = []
  const ptDiffChildren = fromPtDiffText
    .split(TextSymbols.CHILD_SYMBOL)
    .filter((text) => !!text)
    .join('')
  const ptDiffMatchString = ptDiffChildren
  const controlString = ptDiffMatchString.substring(
    0,
    ptDiffMatchString.indexOf(seg.text) + seg.text.length
  )
  const toTest = controlString.substring(0, controlString.indexOf(seg.text))
  const marks: string[] = []
  const matches = [...toTest.matchAll(markRegex)]
  matches.forEach((match) => {
    const sym = match[0]
    const set = TextSymbols.DECORATOR_SYMBOLS.concat(TextSymbols.ANNOTATION_SYMBOLS).find(
      (aSet) => aSet.indexOf(sym) > -1
    )
    if (set) {
      const isMarkStart = sym === set[0]
      const mark: string =
        decoratorTypes[
          isMarkStart ? decoratorSymbolsStart.indexOf(sym) : decoratorSymbolsEnd.indexOf(sym)
        ]?.value || sym // Annotation marks are uniqe anyway
      const notClosed = toTest.lastIndexOf(sym) > toTest.lastIndexOf(set[1])
      if (notClosed) {
        marks.push(mark)
      }
    }
  })
  marksChanged = xor(activeMarks, uniq(marks))
  // Only for decorators, annotations are taken care of elsewhere
  if (
    marksAnnotation &&
    marksChanged.length > 0 &&
    marksChanged.some((m) => isDecorator(m, spanSchemaType))
  ) {
    returned = (
      <DiffCard
        annotation={marksAnnotation}
        key={`diffcard-annotation-${segIndex}-${marksChanged.join('-')}`}
        as={'ins'}
        tooltip={{
          description: 'Changed formatting',
        }}
      >
        {returned}
      </DiffCard>
    )
  }
  return returned
}

function isEmptyTextChange(block: PortableTextBlock, diff: PortableTextDiff) {
  return (
    block.children.length === 1 &&
    block.children[0]._type === 'span' &&
    typeof block.children[0].text === 'string' &&
    block.children[0].text === '' &&
    diff.origin.action !== 'unchanged'
  )
}
