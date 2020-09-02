import React from 'react'
import {PortableTextBlock, PortableTextChild, ChildMap} from './types'
import {isDecorator, isHeader, diffDidRemove, MISSING_TYPE_NAME} from './helpers'

import Annotation from './previews/Annotation'
import Decorator from './previews/Decorator'
import InlineObject from './previews/InlineObject'
import Blockquote from './previews/Blockquote'
import Header from './previews/Header'
import Paragraph from './previews/Paragraph'

import styles from './PTDiff.css'
import {ObjectDiff} from '../../index'
import {ObjectSchemaType} from '../../types'

type Props = {
  blockDiff: ObjectDiff
  childMap: ChildMap
}

export const PortableText = (props: Props): JSX.Element => {
  const {blockDiff, childMap} = props

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
  const renderInlineObject = (props: {child: PortableTextChild}): React.ReactNode => {
    const {child} = props
    return <InlineObject object={child} />
  }

  const invalidInlineObjectType = (props: any) => {
    return <span className={styles.inlineObjectDiff}>Invalid type</span>
  }

  const otherTypes = {}
  Object.keys(childMap)
    .map(key => childMap[key])
    .forEach(mapEntry => {
      const {child} = mapEntry
      const type = typeof child === 'object' && (child._type as string)
      const isSpan = child && typeof child._type === 'string' && child._type === 'span'
      if (!isSpan && type) {
        otherTypes[type] = renderInlineObject
      } else {
        // This should not happen. But have a fallback for missing types anyway.
        // 'undefined' key is set when building the childMap (helpers) when there is no schema found for this object
        // TODO: remove this when diffs don't have references to leftover types.
        otherTypes[MISSING_TYPE_NAME] = props => invalidInlineObjectType(props)
      }
    })

  const renderChild = (child: PortableTextChild) => {
    const fromMap = childMap[child._key]
    // Render span or inline object?
    const inlineObject = otherTypes[child._type]
    const renderSpanOrInline = inlineObject ? inlineObject : () => child.text
    let returned: React.ReactNode =
      fromMap && fromMap.annotation ? fromMap.annotation : renderSpanOrInline({child})
    // Render decorators
    !inlineObject &&
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
    !inlineObject &&
      child.marks &&
      (
        child.marks.filter(mark => !isDecorator(mark, fromMap.schemaType as ObjectSchemaType)) || []
      ).map(markDefKey => {
        returned = (
          <Annotation span={child} block={block} markDefKey={markDefKey}>
            {returned}
          </Annotation>
        )
      })
    return returned
  }

  // Do the final render
  let block = blockDiff.toValue as PortableTextBlock

  // If something is removed, we should show the beforeValue?
  // TODO: check up on this!
  if (diffDidRemove(blockDiff)) {
    block = blockDiff.fromValue as PortableTextBlock
  }

  const children = block.children || []
  return renderBlock({
    block,
    children: children.map(child => renderChild(child))
  })
}
