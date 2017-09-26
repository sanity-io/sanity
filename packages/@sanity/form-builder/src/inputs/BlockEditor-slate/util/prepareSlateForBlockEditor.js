import React from 'react'
import {Block, setKeyGenerator} from 'slate'
import createBlockNode from '../createBlockNode'
import createInlineNode from '../createInlineNode'
import createSpanNode from '../createSpanNode'
import mapToObject from './mapToObject'
import randomKey from '../util/randomKey'

import {getSpanType} from './spanHelpers'
import {BLOCK_DEFAULT_STYLE, SLATE_DEFAULT_BLOCK} from '../constants'

// Preview components of different text types
import Blockquote from '../preview/Blockquote'
import Header from '../preview/Header'
import ListItem from '../preview/ListItem'
import Decorator from '../preview/Decorator'
import Normal from '../preview/Normal'

// Set our own key generator for Slate
const keyGenerator = () => randomKey(12)
setKeyGenerator(keyGenerator)

// When the slate-fields are rendered in the editor, their node data is stored in a parent container component.
// In order to use the node data as props inside our components, we have to dereference them here first (see list and header keys)
const slateTypeComponentMapping = {
  normal: Normal,
  h1(props) {
    return <Header level={1} {...props} />
  },
  h2(props) { // eslint-disable-line react/no-multi-comp
    return <Header level={2} {...props} />
  },
  h3(props) { // eslint-disable-line react/no-multi-comp
    return <Header level={3} {...props} />
  },
  h4(props) { // eslint-disable-line react/no-multi-comp
    return <Header level={4} {...props} />
  },
  h5(props) { // eslint-disable-line react/no-multi-comp
    return <Header level={5} {...props} />
  },
  h6(props) { // eslint-disable-line react/no-multi-comp
    return <Header level={6} {...props} />
  },
  listItem(props) { // eslint-disable-line react/no-multi-comp
    // eslint-disable-next-line react/prop-types
    const listItem = props.children[0] && props.children[0].props.parent.data.get('listItem')
    // eslint-disable-next-line react/prop-types
    const level = props.children[0] && props.children[0].props.parent.data.get('level')
    // eslint-disable-next-line react/prop-types
    const style = (props.children[0] && props.children[0].props.parent.data.get('style'))
      || BLOCK_DEFAULT_STYLE
    const contentComponent = slateTypeComponentMapping[style]
    return <ListItem contentComponent={contentComponent} level={level} listItem={listItem} {...props} />
  },
  blockquote: Blockquote,
}

// Create a contentBlock component
function createContentBlock(props) {
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


  const memberTypesExceptBlock = type.of.filter(ofType => ofType.name !== 'block')
  const spanType = getSpanType(type)
  const allowedDecorators = spanType.decorators.map(decorator => decorator.value)

  const FormBuilderBlock = createBlockNode(type)
  const FormBuilderInline = createInlineNode(type)

  const slateSchema = {
    nodes: {
      ...mapToObject(
        memberTypesExceptBlock,
        ofType => [ofType.name, ofType.options && ofType.options.inline ? FormBuilderInline : FormBuilderBlock]
      ),
      __unknown: FormBuilderBlock,
      span: createSpanNode(spanType),
      contentBlock: createContentBlock,
    },
    marks: mapToObject(allowedDecorators, decorator => {
      return [decorator, Decorator]
    }),
    rules: [
      // Rule to insert a default block when document is empty,
      // or only contains one empty contentBlock
      {
        match: node => {
          return node.kind === 'document'
        },
        validate: document => {
          return (
            document.nodes.size === 0
            || (
              document.nodes.size === 1
                && document.nodes.first().type === SLATE_DEFAULT_BLOCK.type
                && document.nodes.first().text === ''
                && document.nodes.first().data.get('style') !== BLOCK_DEFAULT_STYLE
            )
          ) ? document : null
        },
        normalize: (change, document) => {
          change.deselect()
          const hasEmptySingleContentBlock = document.nodes.size === 1
          change.insertNodeByKey(document.key, 0, Block.create(SLATE_DEFAULT_BLOCK))
          if (hasEmptySingleContentBlock) {
            change.removeNodeByKey(document.nodes.first().key)
          }
          return change.collapseToStartOf(change.state.document.nodes.first()).focus()
        }
      },
      // Rule to ensure that every non-void block has a style
      {
        match: node => {
          if (node.kind === 'block' && !node.isVoid
          ) {
            return node
          }
          return undefined
        },
        validate: block => {
          return block.data.get('style') === undefined ? block : null
        },
        normalize: (change, block) => {
          const data = {...block.data.toObject(), style: BLOCK_DEFAULT_STYLE}
          return change
            .setNodeByKey(block.key, {data})
        }
      },
      // Rule to ensure that annotation _key's within a block is unique
      // Duplication can happen when copy/pasting annotation spans within the same block
      {
        match: node => {
          // contentBlock with annotations
          return node.kind === 'block'
            && node.type === 'contentBlock'
            && node.filterDescendants(desc => {
              const annotations = desc.data && desc.data.get('annotations')
              return annotations && Object.keys(annotations).length
            }).size
        },

        validate: contentBlock => {
          // return the last occurence of nodes with annotations that has the same _key
          const duplicateKeyNodes = contentBlock.filterDescendants(
            desc => desc.data && desc.data.get('annotations')
          )
            .toArray()
            .map(aNode => {
              const annotations = aNode.data.get('annotations')
              return Object.keys(annotations).map(name => annotations[name]._key)
            })
            .reduce((a, b) => {
              return a.concat(b)
            }, [])
            .filter((key, i, keys) => keys.lastIndexOf(key) !== i)
          if (duplicateKeyNodes.length) {
            return duplicateKeyNodes.map(key => {
              return {
                dupKey: key,
                dupNode: contentBlock.filterDescendants(
                  desc => {
                    const annotations = desc.data && desc.data.get('annotations')
                    return annotations
                      && Object.keys(annotations)
                        .find(name => annotations[name]._key === key)
                  }
                ).toArray().slice(-1)[0] // Last occurence
              }
            })
          }
          return null
        },
        normalize: (change, node, dupNodes) => {
          dupNodes.forEach(dup => {
            const {dupKey, dupNode} = dup
            const annotations = {...dupNode.data.get('annotations')}
            const newAnnotations = {}
            Object.keys(annotations).forEach(name => {
              newAnnotations[name] = {...annotations[name]}
              if (annotations[name]._key === dupKey) {
                newAnnotations[name]._key = randomKey(12)
              }
            })
            const data = {...dupNode.data.toObject(), annotations: newAnnotations}
            change.setNodeByKey(dupNode.key, {data})
          })
          return change
        }
      }
    ]
  }
  return {
    listItems: listItems,
    textStyles: textStyles,
    annotationTypes: spanType.annotations,
    decorators: spanType.decorators,
    customBlocks: memberTypesExceptBlock,
    slateSchema: slateSchema
  }
}
