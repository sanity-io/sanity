import React, {SyntheticEvent} from 'react'
import {flatten, uniq} from 'lodash'
import {PortableTextBlock, PortableTextChild, ChildMap, PortableTextDiff} from '../types'
import {
  ANNOTATION_SYMBOLS,
  childIsSpan,
  getChildSchemaType,
  getDecorators,
  isDecorator,
  isHeader,
  MARK_SYMBOLS,
  UNKNOWN_TYPE_NAME
} from '../helpers'

import {
  ArrayDiff,
  DiffCard,
  DiffTooltip,
  ObjectDiff,
  useDiffAnnotationColor
} from '../../../../diff'
import {ObjectSchemaType, SchemaType} from '../../../../types'
import Annotation from './Annotation'
import Decorator from './Decorator'
import InlineObject from './InlineObject'
import Blockquote from './Blockquote'
import Header from './Header'
import Paragraph from './Paragraph'
import styles from './Block.css'

const markSymbolsFlattened = flatten(MARK_SYMBOLS)
const markSymbolsStart = MARK_SYMBOLS.map(set => set[0])
const markSymbolsEnd = MARK_SYMBOLS.map(set => set[1])
const annotationSymbolsStart = ANNOTATION_SYMBOLS.map(set => set[0])
const annotationSymbolsEnd = ANNOTATION_SYMBOLS.map(set => set[1])

type Props = {
  diff: PortableTextDiff
  childMap: ChildMap
  experimentalDiff: PortableTextDiff
  schemaType: ObjectSchemaType
}

export default function Experimental(props: Props): JSX.Element {
  const {diff, childMap, experimentalDiff, schemaType} = props

  const handleObjectFocus = (event: SyntheticEvent<HTMLSpanElement>) => {
    // TODO: implement this later on when we can do focus in the editor pane
    // eslint-disable-next-line no-alert
    alert('Focus object here!')
  }

  const color = useDiffAnnotationColor(diff, [])

  const renderBlock = ({
    block,
    children
  }: {
    block: PortableTextBlock
    children: React.ReactNode
  }): JSX.Element => {
    const classNames = [styles.root, diff.action, `style_${diff.displayValue.style || 'undefined'}`]
    let returned: React.ReactNode = children
    let fromStyle

    // If style was changed, indicate that
    if (diff.action === 'changed' && diff.fields.style && diff.fields.style.action === 'changed') {
      fromStyle = diff.fromValue.style
      classNames.push(`changed_from_style_${fromStyle || 'undefined'}`)
      const style = color ? {background: color.background, color: color.text} : {}

      returned = (
        <div className={styles.styleIsChanged}>
          <div className={styles.changedBlockStyleNotice}>
            <DiffTooltip diff={diff.fields.style} as={'div'}>
              Changed block style from '{fromStyle}'
            </DiffTooltip>
          </div>
          <div style={style}>{returned}</div>
        </div>
      )
    }

    if (block.style === 'blockquote') {
      returned = <Blockquote block={block}>{returned}</Blockquote>
    } else if (block.style && isHeader(block)) {
      returned = (
        <Header block={block} style={block.style}>
          {returned}
        </Header>
      )
    } else {
      returned = <Paragraph block={block}>{returned}</Paragraph>
    }
    return <div className={classNames.join(' ')}>{returned}</div>
  }

  const findMarksDiff = (mark: string, text: string) => {
    const spanDiff =
      diff.fields.children &&
      diff.fields.children.action === 'changed' &&
      diff.fields.children.type === 'array' &&
      (diff.fields.children.items.find(
        // TODO: could this be done better? We cant exact match on string as they may be broken apart.
        // Check for indexOf string for now
        // eslint-disable-next-line complexity
        item =>
          item.diff &&
          item.diff.type === 'object' &&
          item.diff.fields.marks &&
          item.diff.fields.marks.type === 'array' &&
          item.diff.fields.text &&
          item.diff.fields.text.type === 'string' &&
          ((item.diff.fields.text.toValue && item.diff.fields.text.toValue.indexOf(text) > -1) ||
            (item.diff.fields.text.fromValue &&
              item.diff.fields.text.fromValue.indexOf(text) > -1)) &&
          ((Array.isArray(item.diff.fields.marks.toValue) &&
            item.diff.fields.marks.toValue.includes(mark)) ||
            (Array.isArray(item.diff.fields.marks.fromValue) &&
              item.diff.fields.marks.fromValue.includes(mark)))
      )?.diff as ObjectDiff)
    return (
      spanDiff &&
      spanDiff.fields.marks &&
      spanDiff.fields.marks.type === 'array' &&
      spanDiff.fields.marks.action !== 'unchanged' &&
      spanDiff.fields.marks.items.find(
        item => item.diff.toValue === mark || item.diff.fromValue === mark
      )?.diff
    )
  }

  const renderDecorator = (mark: string, text: string, input: React.ReactElement) => {
    let returned = input
    const marksDiff = findMarksDiff(mark, text)
    const isRemoved = marksDiff && marksDiff.action === 'removed'
    if (marksDiff && marksDiff.action !== 'unchanged') {
      returned = (
        <DiffCard annotation={marksDiff.annotation} description={`Formatting ${marksDiff.action}`}>
          {returned}
        </DiffCard>
      )
    }
    if (!isRemoved) {
      returned = (
        <Decorator block={block} mark={mark}>
          {returned}
        </Decorator>
      )
    }
    return returned
  }

  const renderAnnotation = (mark: string, block: PortableTextBlock, input: React.ReactElement) => {
    let returned = input
    const annotationDiff =
      diff.fields.markDefs &&
      diff.fields.markDefs.isChanged &&
      diff.fields.markDefs.type === 'array' &&
      diff.fields.markDefs.items.find(
        item =>
          item.diff &&
          item.diff.type === 'object' &&
          item.diff.toValue &&
          item.diff.toValue._key &&
          item.diff.toValue._key === mark
      )?.diff
    returned = (
      <Annotation block={block} markDefKey={mark} onClick={handleObjectFocus}>
        {annotationDiff && annotationDiff.action !== 'unchanged' ? (
          <DiffCard
            annotation={annotationDiff.annotation}
            as="ins"
            description={`Annotation ${annotationDiff.action} by`}
          >
            {returned}
          </DiffCard>
        ) : (
          returned
        )}
      </Annotation>
    )
    return returned
  }

  const renderWithMarks = (
    activeMarks: string[],
    removedMarks: string[],
    text: string,
    spanSchemaType: SchemaType
  ) => {
    const allMarks = uniq([...activeMarks, ...removedMarks]).sort()
    if (allMarks.length) {
      let returned = <>{text}</>
      allMarks.forEach(mark => {
        if (isDecorator(mark, spanSchemaType)) {
          returned = renderDecorator(mark, text, returned)
        } else {
          returned = renderAnnotation(mark, block, returned)
        }
      })
      return returned
    }
    return text
  }

  const renderChild = (child: PortableTextChild) => {
    const spanSchemaType = getChildSchemaType(schemaType.fields, child)
    let decoratorTypes: {title: string; value: string}[] = []
    if (spanSchemaType) {
      decoratorTypes = getDecorators(spanSchemaType)
      const childrenDiff = experimentalDiff.fields.children as ArrayDiff
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
      // eslint-disable-next-line complexity
      segments.forEach(seg => {
        const isInline = seg.text.startsWith('<inlineObject')
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
          const keyMatch = seg.text.match(/key='([A-Za-z0-9 _]*)'/)
          const key = keyMatch && keyMatch[1]
          const realChild = diff.displayValue.children.find(
            cld => cld._key === key
          ) as PortableTextChild
          if (key) {
            const realDiff = childMap[key]?.diff as ObjectDiff
            returnedChildren.push(renderInlineObject({child: realChild, diff: realDiff}))
          }
        } else if (seg.action === 'unchanged') {
          returnedChildren.push(
            renderWithMarks(activeMarks, removedMarks, seg.text, spanSchemaType)
          )
        } else if (seg.action === 'removed') {
          // TODO: find annotation
          returnedChildren.push(
            <DiffCard annotation={seg.annotation} as="del" description="Removed">
              {renderWithMarks(activeMarks, removedMarks, seg.text, spanSchemaType)}
            </DiffCard>
          )
        } else if (seg.action === 'added') {
          // TODO: find annotation
          returnedChildren.push(
            <DiffCard annotation={seg.annotation} as="ins" description="Added">
              {renderWithMarks(activeMarks, removedMarks, seg.text, spanSchemaType)}
            </DiffCard>
          )
        }
      })
      return React.createElement('div', {key: block._key}, ...returnedChildren)
    }
    throw new Error('span schemaType not found')
  }

  // Set up renderers for inline object types
  // TODO: previews from schema
  const renderInlineObject = (cProps: {
    child: PortableTextChild
    diff: ObjectDiff
  }): React.ReactNode => {
    return (
      <InlineObject
        key={`inline-object-${cProps.child._key}`}
        object={cProps.child}
        diff={cProps.diff}
        onClick={handleObjectFocus}
      />
    )
  }
  const renderInvalidInlineObjectType = () => {
    return <span>Invalid inline object type</span>
  }
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
  const block = diff.displayValue
  return renderBlock({
    block,
    children: (experimentalDiff.displayValue.children || []).map(child => renderChild(child))
  })
}
