import React from 'react'
import PortableText from '@sanity/block-content-to-react'
import {DiffComponent, ObjectDiff, ObjectSchemaType} from '../../index'

import Blockquote from './previews/Blockquote'
import Decorator from './previews/Decorator'
import Header from './previews/Header'
import Paragraph from './previews/Paragraph'

import {createChildMap, isHeader} from './helpers'

import styles from './PTDiff.css'
import {ChildMap, PortableTextBlock, PortableTextChild} from './types'

export const PTDiff: DiffComponent<ObjectDiff> = function PTDiff({
  diff,
  schemaType
}: {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
}) {
  const block = (diff.toValue ? diff.toValue : diff.fromValue) as PortableTextBlock
  const blocks = [block] as PortableTextBlock[]
  const childMap = createChildMap(block, diff)
  const serializers = createSerializers(schemaType, childMap)
  return (
    <div className={styles.root}>
      <PortableText blocks={blocks} serializers={serializers} />
      <ul className={styles.summary}>
        {block.children.map(child => {
          return childMap[child._key].summary.map((line, i) => (
            <li key={`summary-${child._key.concat(i.toString())}`}>{line}</li>
          ))
        })}
      </ul>
    </div>
  )
}

function createSerializers(schemaType: ObjectSchemaType, childMap: ChildMap) {
  const renderDecorator = ({mark, children}: {mark: string; children: React.ReactNode}) => {
    return <Decorator mark={mark}>{children}</Decorator>
  }
  const renderBlock = ({node, children}: {node: PortableTextBlock; children: React.ReactNode}) => {
    let returned: React.ReactNode = children
    if (node.style === 'blockquote') {
      returned = <Blockquote>{returned}</Blockquote>
    } else if (node.style && isHeader(node)) {
      returned = <Header style={node.style}>{returned}</Header>
    } else {
      returned = <Paragraph>{returned}</Paragraph>
    }
    return returned
  }
  const renderText = (text: {children: string}) => {
    // With '@sanity/block-content-to-react', spans without marks doesn't run through the renderSpan function.
    // They are sent directly to the 'text' serializer. This is a hack to render those with annotations from childMap
    // The _key for the child is not known at this point.

    // Find child that has no marks, and a text similar to what is in the childMap.
    const fromMap = Object.keys(childMap)
      .map(key => childMap[key])
      .filter(entry => (entry.child.marks || []).length === 0)
      .find(entry => entry.child.text === text.children)
    if (fromMap && fromMap.annotation) {
      return <span className={styles.diffedSpan}>{fromMap.annotation}</span>
    }
    return text.children
  }
  const renderSpan = (props: {node: PortableTextChild}): React.ReactNode => {
    const fromMap = childMap[props.node._key]
    if (fromMap && fromMap.annotation) {
      const annotatedProps = {
        ...props,
        node: {...props.node, children: fromMap.annotation}
      }
      return (
        <span className={styles.diffedSpan}>
          {PortableText.defaultSerializers.span(annotatedProps)}
        </span>
      )
    }
    return PortableText.defaultSerializers.span(props)
  }
  // TODO: create serializers according to schemaType (marks etc)
  return {
    marks: {strong: renderDecorator, italic: renderDecorator},
    span: renderSpan,
    text: renderText,
    types: {
      block: renderBlock
    }
  }
}
