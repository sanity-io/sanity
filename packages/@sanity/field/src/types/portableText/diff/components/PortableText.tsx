import React from 'react'
import {startCase, uniq, xor} from 'lodash'
import {ArrayDiff, DiffCard, ObjectDiff, StringDiff} from '../../../../diff'

import {ObjectSchemaType, SchemaType} from '../../../../types'
import {
  PortableTextBlock,
  PortableTextChild,
  PortableTextDiff,
  SpanTypeSchema,
  StringSegment
} from '../types'

import * as TextSymbols from '../symbols'

import {
  findChildDiff,
  findAnnotationDiff,
  findSpanDiffFromChild,
  getChildSchemaType,
  getDecorators,
  getInlineObjects,
  isDecorator
} from '../helpers'

import Block from './Block'
import {Annotation} from './Annotation'
import Decorator from './Decorator'
import {InlineObject} from './InlineObject'

const decoratorSymbolsStart = TextSymbols.DECORATOR_SYMBOLS.map(set => set[0])
const decoratorSymbolsEnd = TextSymbols.DECORATOR_SYMBOLS.map(set => set[1])
const annotationSymbolsStart = TextSymbols.ANNOTATION_SYMBOLS.map(set => set[0])
const annotationSymbolsEnd = TextSymbols.ANNOTATION_SYMBOLS.map(set => set[1])

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

  const inlineObjects = diff.origin.toValue
    ? getInlineObjects(diff.origin.toValue as PortableTextBlock)
    : []

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
      const returnedChildren: React.ReactNode[] = []

      // Special case for new empty PT-block (single span child with empty text)
      if (isEmptyTextChange(block, diff)) {
        const textDiff = findChildDiff(diff.origin, block.children[0]) || diff.origin
        if (textDiff && textDiff.action !== 'unchanged') {
          return (
            <DiffCard
              annotation={textDiff.annotation}
              as={textDiff.action === 'removed' ? 'del' : 'ins'}
              tooltip={{
                description: `${startCase(textDiff.action)} empty text`
              }}
            >
              <span>{TextSymbols.EMPTY_BLOCK_SYMBOL}</span>
            </DiffCard>
          )
        }
      }
      // Run through all the segments from the PortableTextDiff
      let childIndex = -1
      segments.forEach(seg => {
        const isInline = TextSymbols.INLINE_SYMBOLS.includes(seg.text)
        const isMarkStart = allSymbolsStart.includes(seg.text)
        const isMarkEnd = allSymbolsEnd.includes(seg.text)
        const isChildStart = seg.text === TextSymbols.CHILD_SYMBOL
        const isRemoved = seg.action === 'removed'
        if (isChildStart) {
          if (!isRemoved) {
            childIndex++
          }
          // No output
        } else if (isMarkStart || isMarkEnd) {
          // No output
        } else if (isInline) {
          // Render inline object
          const indexOfSymbol = TextSymbols.INLINE_SYMBOLS.findIndex(sym => sym === seg.text)
          const key = inlineObjects[indexOfSymbol]?._key
          const originChild = (diff.origin.toValue || diff.origin.fromValue).children.find(
            cld => cld._key === key
          ) as PortableTextChild
          if (key) {
            const objectSchemaType = getChildSchemaType(schemaType.fields, originChild)
            const objectDiff = findChildDiff(diff.origin, originChild)
            returnedChildren.push(
              <InlineObject
                key={`inline-object-${originChild._key}`}
                object={originChild}
                diff={objectDiff}
                schemaType={objectSchemaType}
              />
            )
          }
        } else if (seg.text) {
          // Render text
          returnedChildren.push(
            <span key={`segment-${returnedChildren.length}`}>
              {renderTextSegment({
                diff: diff,
                child: block.children[childIndex],
                decoratorTypes,
                seg,
                spanSchemaType
              })}
            </span>
          )
        }
      })
      return React.createElement('div', {key: block._key}, ...returnedChildren)
    }
    throw new Error("'span' schemaType not found")
  }

  return (
    <Block block={diff.displayValue} diff={diff}>
      {(diff.displayValue.children || []).map(child => renderChild(child))}
    </Block>
  )
}

function renderTextSegment({
  diff,
  child,
  decoratorTypes,
  seg,
  spanSchemaType
}: {
  diff: PortableTextDiff
  child: PortableTextChild
  decoratorTypes: {title: string; value: string}[]
  seg: StringSegment
  spanSchemaType: SpanTypeSchema
}): JSX.Element {
  // Newlines
  if (seg.text === '\n') {
    return <br />
  }
  // Make sure we render trailing spaces correctly
  let children = <>{seg.text.replace(/ /g, TextSymbols.TRAILING_SPACE_SYMBOL)}</>

  const spanDiff = child && findSpanDiffFromChild(diff.origin, child)
  const textDiff = spanDiff?.fields?.text ? (spanDiff?.fields?.text as StringDiff) : undefined
  let hasChangedText = false
  if (seg.action !== 'unchanged') {
    if (textDiff && textDiff.action !== 'unchanged') {
      hasChangedText = true
      children = (
        <DiffCard
          annotation={textDiff.annotation}
          as={seg.action === 'removed' ? 'del' : 'ins'}
          tooltip={{description: `${startCase(seg.action)} text`}}
        >
          {children}
        </DiffCard>
      )
    } else {
      children = (
        <DiffCard
          annotation={
            (diff.origin && diff.origin.action !== 'unchanged' && diff.origin.annotation) ||
            undefined
          }
          as={seg.action === 'removed' ? 'del' : 'ins'}
          tooltip={{description: `${startCase(seg.action)} text`}}
        >
          {children}
        </DiffCard>
      )
    }
  }

  const hasChangedMarkDefs = renderMarkDefs({child, diff, children, seg})
  if (hasChangedMarkDefs) {
    children = hasChangedMarkDefs
  }

  // Render mark diff info
  const activeMarks = child ? child.marks || [] : []
  const hasOtherChanges = hasChangedMarkDefs || hasChangedText
  if (!hasOtherChanges && spanDiff) {
    children = renderMarks({
      activeMarks,
      decoratorTypes,
      diff,
      children,
      seg,
      spanDiff,
      spanSchemaType
    })
  }
  // Render the segment with the active marks
  if (activeMarks && activeMarks.length > 0) {
    activeMarks.forEach(mark => {
      if (isDecorator(mark, spanSchemaType)) {
        children = <Decorator mark={mark}>{children}</Decorator>
      } else {
        const annotationDiff = findAnnotationDiff(diff.origin, mark)
        const annotationObject =
          annotationDiff &&
          ((annotationDiff.toValue || annotationDiff.fromValue) as PortableTextChild)
        const objectSchemaType =
          annotationObject &&
          spanSchemaType.annotations &&
          spanSchemaType.annotations.find(type => type.name === annotationObject._type)
        if (annotationObject) {
          children = (
            <Annotation
              object={annotationObject}
              diff={annotationDiff}
              schemaType={objectSchemaType}
            >
              {children}
            </Annotation>
          )
        }
      }
    })
  }
  return children
}

function renderMarks({
  activeMarks,
  decoratorTypes,
  diff,
  children,
  seg,
  spanDiff,
  spanSchemaType
}: {
  activeMarks: string[]
  decoratorTypes: {title: string; value: string}[]
  diff: PortableTextDiff
  children: JSX.Element
  seg: StringSegment
  spanDiff: ObjectDiff
  spanSchemaType: SchemaType
}): JSX.Element {
  let returned = <>{children}</>
  const fromPtDiffText =
    (diff.origin.fromValue && diff.fromValue && diff.fromValue.children[0].text) || undefined // Always one child
  // TODO: there is currently an issue where the marksDiff has a null-annotation when it shouldn't.
  // Figure this out! In the meantime, fallback to spanDiff (where the annotation exists, but last edit will win)
  const fallbackMarksAnnotation =
    (spanDiff && spanDiff.action !== 'unchanged' && spanDiff.annotation) || undefined

  const marksDiff = spanDiff?.fields?.marks as ArrayDiff
  const marksAnnotation =
    (marksDiff && marksDiff.action !== 'unchanged' && marksDiff.annotation) ||
    fallbackMarksAnnotation // TODO: remove!

  let marksChanged: string[] = []
  const ptDiffChildren = fromPtDiffText
    .split(TextSymbols.CHILD_SYMBOL)
    .filter(text => !!text)
    .join('')
  const ptDiffMatchString = ptDiffChildren
  const controlString = ptDiffMatchString.substring(
    0,
    ptDiffMatchString.indexOf(seg.text) + seg.text.length
  )
  const toTest = controlString.substring(0, controlString.indexOf(seg.text))
  const marks: string[] = []
  const matches = [...toTest.matchAll(markRegex)]
  matches.forEach(match => {
    const sym = match[0]
    const set = TextSymbols.DECORATOR_SYMBOLS.concat(TextSymbols.ANNOTATION_SYMBOLS).find(
      aSet => aSet.indexOf(sym) > -1
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
  if (marksChanged.length > 0 && marksDiff) {
    const isAnnotation = !isDecorator(marksChanged.slice(-1)[0], spanSchemaType)
    returned = (
      <DiffCard
        annotation={marksAnnotation}
        as={'ins'}
        tooltip={{
          description: `${isAnnotation ? `Changed annotation` : 'Changed formatting'}`
        }}
      >
        {returned}
      </DiffCard>
    )
  }
  return returned
}

function renderMarkDefs({
  child,
  diff,
  children,
  seg
}: {
  child: PortableTextChild
  diff: PortableTextDiff
  children: JSX.Element
  seg: StringSegment
}): JSX.Element | null {
  let returned: JSX.Element | null = null
  if (diff.origin.fields.markDefs && diff.origin.fields.markDefs.action !== 'unchanged') {
    const markDefsDiffs = (
      (diff.origin.fields.markDefs.type === 'array' &&
        diff.origin.fields.markDefs.items.filter(
          item => item.diff.type === 'object' && item.diff.isChanged
        )) ||
      []
    ).map(item => item.diff) as ObjectDiff[]

    markDefsDiffs.forEach(markDefsDiff => {
      // Where was it changed from?
      const fromBlock = diff.origin.fromValue as PortableTextBlock
      const toBlock = diff.origin.toValue as PortableTextBlock
      const span =
        markDefsDiff.action === 'removed'
          ? fromBlock.children.find(
              cld => markDefsDiff.fromValue && cld.marks?.includes(markDefsDiff.fromValue._key)
            )
          : toBlock.children.find(
              cld => markDefsDiff.toValue && cld.marks?.includes(markDefsDiff.toValue._key)
            )
      if (span && span._key === child._key && seg.text === span.text && markDefsDiff.fromValue) {
        const annotationDiff = findAnnotationDiff(diff.origin, markDefsDiff.fromValue._key)
        if (annotationDiff && annotationDiff.action !== 'unchanged') {
          returned = (
            <DiffCard
              annotation={annotationDiff.annotation}
              as={'ins'}
              tooltip={{
                description: `${startCase(markDefsDiff.action)} annotation`
              }}
            >
              {children}
            </DiffCard>
          )
        }
      }
    })
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
