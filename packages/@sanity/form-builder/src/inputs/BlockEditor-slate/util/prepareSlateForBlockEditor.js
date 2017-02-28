import React from 'react'
import {Block} from 'slate'
import createBlockNode from '../createBlockNode'
import createSpanNode from '../createSpanNode'
import mapToObject from './mapToObject'

import {getSpanType} from './spanHelpers'
import {SLATE_DEFAULT_STYLE} from '../constants'

// Content previews
import Blockquote from '../preview/Blockquote'
import Header from '../preview/Header'
import ListItem from '../preview/ListItem'
import Mark from '../preview/Mark'
import Normal from '../preview/Normal'

// When the slate-fields are rendered in the editor, their node data is stored in a parent container component.
// In order to use the node data as props inside our components, we have to dereference them here first (see list and header keys)
const slateTypeComponentMapping = {
  normal: Normal,
  h1(props) {
    return <Header level={1} {...props} />
  },
  h2(props) {  // eslint-disable-line react/no-multi-comp
    return <Header level={2} {...props} />
  },
  h3(props) {  // eslint-disable-line react/no-multi-comp
    return <Header level={3} {...props} />
  },
  h4(props) {  // eslint-disable-line react/no-multi-comp
    return <Header level={4} {...props} />
  },
  h5(props) {  // eslint-disable-line react/no-multi-comp
    return <Header level={5} {...props} />
  },
  h6(props) {  // eslint-disable-line react/no-multi-comp
    return <Header level={6} {...props} />
  },
  listItem(props) {  // eslint-disable-line react/no-multi-comp
    // eslint-disable-next-line react/prop-types
    const listItem = props.children[0] && props.children[0].props.parent.data.get('listItem')
    // eslint-disable-next-line react/prop-types
    const style = (props.children[0] && props.children[0].props.parent.data.get('style'))
      || SLATE_DEFAULT_STYLE
    const contentComponent = slateTypeComponentMapping[style]
    return <ListItem contentComponent={contentComponent} listItem={listItem} {...props} />
  },
  blockquote: Blockquote,
}

function createSlatePreviewNode(props) {
  let component = null
  const style = props.children[0] && props.children[0].props.parent.data.get('style')
  const isListItem = props.children[0] && props.children[0].props.parent.data.get('listItem')
  if (isListItem) {
    component = slateTypeComponentMapping.listItem
  } else {
    component = slateTypeComponentMapping[style]
  }
  if (!component) {
    // eslint-disable-next-line no-console
    console.warn(`No mapping for style '${style}' exists, using 'normal'`)
    component = slateTypeComponentMapping.normal
  }
  return component(props)
}

export default function prepareSlateForBlockEditor(blockEditor) {
  const type = blockEditor.props.type
  const blockType = type.of.find(ofType => ofType.name === 'block')
  if (!blockType) {
    throw new Error("'block' type is not defined in the schema (required).")
  }

  const styleField = blockType.fields.find(btField => btField.name === 'style')
  if (!styleField) {
    throw new Error("A field with name 'style' is not defined in the block type (required).")
  }

  const textStyles = styleField.type.options.list
    && styleField.type.options.list.filter(style => style.value)
  if (!textStyles || textStyles.length === 0) {
    throw new Error('The style fields need at least one style '
      + "defined. I.e: {title: 'Normal', value: 'normal'}.")
  }

  const listField = blockType.fields.find(btField => btField.name === 'list')
  let listItems = []
  if (listField) {
    listItems = listField.type.options.list
      && listField.type.options.list.filter(listStyle => listStyle.value)
  }

  const allowedMarks = blockType.fields.find(btField => btField.name === 'spans')
    .type.of.find(of => of.name === 'span')
    .fields.find(field => field.name === 'marks')
    .type
    .options
    .list.map(mark => mark.value)

  const memberTypesExceptBlock = type.of.filter(ofType => ofType.name !== 'block')
  const spanType = getSpanType(type).type

  const schema = {
    nodes: {
      ...mapToObject(memberTypesExceptBlock, ofType => [ofType.name, createBlockNode(ofType)]),
      span: createSpanNode(spanType),
      contentBlock: createSlatePreviewNode,
    },
    marks: mapToObject(allowedMarks, mark => {
      return [mark, Mark]
    }),
    rules: [
      // Rule to insert a default block when document is empty
      {
        match: node => {
          return node.kind === 'document'
        },
        validate: document => {
          return document.nodes.size ? null : true
        },
        normalize: (transform, document) => {
          const block = Block.create({
            type: 'contentBlock',
            data: {style: SLATE_DEFAULT_STYLE}
          })
          transform
            .insertNodeByKey(document.key, 0, block)
            .focus()
        }
      }
    ]
  }
  return {
    listItems: listItems,
    textStyles: textStyles,
    schema: schema
  }
}
