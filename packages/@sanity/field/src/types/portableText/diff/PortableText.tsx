import React, {SyntheticEvent} from 'react'
import {PortableTextBlock, PortableTextChild, ChildMap} from './types'
import {isDecorator, isHeader, childIsSpan, diffDidRemove, MISSING_TYPE_NAME} from './helpers'

import Annotation from './previews/Annotation'
import Decorator from './previews/Decorator'
import InlineObject from './previews/InlineObject'
import Blockquote from './previews/Blockquote'
import Header from './previews/Header'
import Paragraph from './previews/Paragraph'
import Span from './previews/Span'

import styles from './PTDiff.css'
import {ObjectSchemaType, ObjectDiff} from '../../../diff'

type Props = {
  blockDiff: ObjectDiff
  childMap: ChildMap
}

export const PortableText = (props: Props): JSX.Element => {
  const {blockDiff, childMap} = props

  const handleObjectClick = (event: SyntheticEvent<HTMLSpanElement>) => {
    alert('Focus object here!')
  }

  const renderBlock = ({
    block,
    children
  }: {
    block: PortableTextBlock
    children: React.ReactNode
  }): JSX.Element => {
    let returned: React.ReactNode = children
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
    return <>{returned}</>
  }

  const renderChild = (child: PortableTextChild) => {
    const fromMap = childMap[child._key]
    const diff = fromMap.diffs[0] as ObjectDiff
    // Render span or inline object?
    const renderInlineObject = renderObjectTypes[child._type]
    const renderSpanOrInline = renderInlineObject
      ? props => renderInlineObject({child, diff})
      : props => renderSpan({child, diff})
    const isSpan = childIsSpan(child)
    let returned = renderSpanOrInline({child})
    // Render decorators
    isSpan &&
      child.marks &&
      (
        child.marks.filter(mark => isDecorator(mark, fromMap.schemaType as ObjectSchemaType)) || []
      ).map(mark => {
        returned = (
          <Decorator block={block} mark={mark} span={child}>
            {returned}
          </Decorator>
        )
      })
    // Render annotations
    isSpan &&
      child.marks &&
      (
        child.marks.filter(mark => !isDecorator(mark, fromMap.schemaType as ObjectSchemaType)) || []
      ).map(markDefKey => {
        returned = (
          <Annotation
            span={child}
            block={block}
            markDefKey={markDefKey}
            onClick={handleObjectClick}
          >
            {returned}
          </Annotation>
        )
      })
    return returned
  }

  const renderSpan = (props: {child: PortableTextChild; diff: ObjectDiff}): React.ReactNode => {
    const {child, diff} = props
    return <Span span={child} diff={diff} />
  }

  // Set up renderers for inline object types
  // TODO: previews from schema
  const renderInlineObject = (props: {
    child: PortableTextChild
    diff: ObjectDiff
  }): React.ReactNode => {
    const {child, diff} = props
    return <InlineObject object={child} diff={diff} onClick={handleObjectClick} />
  }
  const renderInvalidInlineObjectType = () => {
    return <span className={styles.inlineObjectDiff}>Invalid inline object type</span>
  }
  const renderObjectTypes = {}
  Object.keys(childMap)
    .map(key => childMap[key])
    .forEach(mapEntry => {
      const {child} = mapEntry
      if (!childIsSpan(child) && child._type) {
        renderObjectTypes[child._type] = renderInlineObject
      } else {
        // This should not happen. But have a fallback for rendering missing types anyway.
        renderObjectTypes[MISSING_TYPE_NAME] = renderInvalidInlineObjectType
      }
    })

  let block = blockDiff.toValue as PortableTextBlock

  // If something is removed, we should show the beforeValue?
  // TODO: check up on this!
  if (diffDidRemove(blockDiff)) {
    block = blockDiff.fromValue as PortableTextBlock
  }

  return renderBlock({
    block,
    children: (block.children || []).map(child => renderChild(child))
  })
}
