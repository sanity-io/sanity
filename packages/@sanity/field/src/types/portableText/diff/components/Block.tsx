import React, {SyntheticEvent} from 'react'
import {PortableTextBlock, PortableTextChild, ChildMap, PortableTextDiff} from '../types'
import {isDecorator, isHeader, childIsSpan, UNKNOWN_TYPE_NAME} from '../helpers'

import {
  ObjectDiff,
  DiffAnnotation,
  DiffAnnotationTooltip,
  useDiffAnnotationColor
} from '../../../../diff'
import {ObjectSchemaType} from '../../../../types'
import Annotation from './Annotation'
import Decorator from './Decorator'
import InlineObject from './InlineObject'
import Blockquote from './Blockquote'
import Header from './Header'
import Paragraph from './Paragraph'
import Span from './Span'

import styles from './Block.css'

type Props = {
  diff: PortableTextDiff
  childMap: ChildMap
}

export default function Block(props: Props): JSX.Element {
  const {diff, childMap} = props

  const handleObjectFocus = (event: SyntheticEvent<HTMLSpanElement>) => {
    // TODO: implement this later on when we can do focus in the editor pane
    // eslint-disable-next-line no-alert
    alert('Focus object here!')
  }

  // eslint-disable-next-line complexity
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
      const color = useDiffAnnotationColor(diff, [])
      const style = color ? {background: color.background, color: color.text} : {}

      returned = (
        <div className={styles.styleIsChanged}>
          <div className={styles.changedBlockStyleNotice}>
            <DiffAnnotationTooltip diff={diff.fields.style} as={'div'}>
              Changed block style from '{fromStyle}'
            </DiffAnnotationTooltip>
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

  // eslint-disable-next-line complexity
  const renderChild = (child: PortableTextChild) => {
    let cDiff
    const fromMap = childMap[child._key]
    if (fromMap) {
      cDiff = fromMap.diff as ObjectDiff
    }
    const isSpan = childIsSpan(child)
    // Render span or inline object?
    const renderInlineObject = renderObjectTypes[child._type]
    const renderSpanOrInline =
      !isSpan && renderInlineObject
        ? cProps => renderInlineObject({...cProps, child, diff: cDiff, blockDiff: diff})
        : cProps => renderSpan({...cProps, child, diff: cDiff, blockDiff: diff})
    let returned = renderSpanOrInline({child})
    // Render decorators
    // eslint-disable-next-line no-unused-expressions
    isSpan &&
      child.marks &&
      (
        child.marks.filter(mark => isDecorator(mark, fromMap.schemaType as ObjectSchemaType)) || []
      ).forEach(mark => {
        const hasMarksDiff =
          cDiff &&
          (cDiff.fromValue === child || cDiff.toValue === child) &&
          cDiff.isChanged &&
          cDiff.fields.marks &&
          cDiff.fields.marks.type === 'array'
        if (hasMarksDiff) {
          const didRemove = cDiff.fields.marks.action === 'removed'
          returned = (
            <DiffAnnotation
              annotation={cDiff.annotation}
              as={didRemove ? 'del' : 'ins'}
              description={`${didRemove ? 'Removed' : 'Added'} formatting`}
            >
              {returned}
            </DiffAnnotation>
          )
        }
        returned = (
          <Decorator key={`decorator-${child._key}-${mark}`} block={block} mark={mark} span={child}>
            {returned}
          </Decorator>
        )
      })
    // Render annotations
    // eslint-disable-next-line no-unused-expressions
    isSpan &&
      child.marks &&
      (
        child.marks.filter(mark => !isDecorator(mark, fromMap.schemaType as ObjectSchemaType)) || []
      ).forEach(markDefKey => {
        returned = (
          <Annotation
            block={block}
            key={`annotation-${child._key}-${markDefKey}`}
            markDefKey={markDefKey}
            onClick={handleObjectFocus}
            span={child}
          >
            {returned}
          </Annotation>
        )
      })
    return returned
  }

  const renderSpan = (sProps: {
    child: PortableTextChild
    diff?: ObjectDiff
    blockDiff?: ObjectDiff
  }): React.ReactNode => {
    return (
      <Span
        key={`span-${sProps.child._key}`}
        block={block}
        blockDiff={sProps.blockDiff}
        diff={sProps.diff}
        span={sProps.child}
      />
    )
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
    children: (diff.displayValue.children || []).map(child => renderChild(child))
  })
}
