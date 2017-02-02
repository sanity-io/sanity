import React from 'react'
import {groupBy} from 'lodash'
import createPreviewNode from '../createFormBuilderPreviewNode'
import mapToObject from './mapToObject'
import Header from '../preview/Header'
import Normal from '../preview/Normal'
import List from '../preview/List'
import ListItem from '../preview/ListItem'
import Mark from '../preview/Mark'
import Link from '../preview/Link'
import {
  SLATE_MANAGED_NODE_TYPES,
  SLATE_LIST_BLOCK_TYPE,
  SLATE_NORMAL_BLOCK_TYPE,
  SLATE_LIST_ITEM_TYPE
} from '../constants'

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
  link(props) { // eslint-disable-line react/no-multi-comp
    // eslint-disable-next-line react/prop-types
    const href = props.children[0] && props.children[0].props.parent.data.get('href')
    // eslint-disable-next-line react/prop-types
    const target = props.children[0] && props.children[0].props.parent.data.get('target')
    return <Link href={href} target={target} {...props} />
  },
  list(props) { // eslint-disable-line react/no-multi-comp
    // eslint-disable-next-line react/prop-types
    const listStyle = props.children[0] && props.children[0].props.parent.data.get('type').listItem
    return <List listStyle={listStyle} {...props} />
  },
  listItem: ListItem
}

export default function prepareSlateShema(type) {

  const normalType = type.of.find(ofType => ofType.default)
  normalType.style = normalType.style || SLATE_NORMAL_BLOCK_TYPE

  const groupedTypes = Object.assign({slate: [], formBuilder: []}, groupBy(type.of, ofType => {
    if (ofType.default || ofType.listItem
        || SLATE_MANAGED_NODE_TYPES.includes(ofType.style)) {
      return 'slate'
    }
    return 'formBuilder'
  }))

  const allowedMarks = normalType && (normalType.marks || [])

  const schema = {
    normalBlock: {
      type: normalType.style,
      isVoid: false,
      data: {type: normalType.type}
    },
    nodes: Object.assign(
        mapToObject(groupedTypes.formBuilder || [], ofType => {
          return [ofType.name, createPreviewNode(ofType)]
        }),
        mapToObject(groupedTypes.slate || [], slateType => {
          if (slateType.listItem) {
            return [SLATE_LIST_BLOCK_TYPE, slateTypeComponentMapping[SLATE_LIST_BLOCK_TYPE]]
          } else if (slateTypeComponentMapping[slateType.style]) {
            return [slateType.style, slateTypeComponentMapping[slateType.style]]
          }
          throw new Error(`Do not know how to make a slate type for ${JSON.stringify(slateType)}`)
        })
    ),
    marks: mapToObject(allowedMarks, mark => {
      return [mark, Mark]
    })
  }
  // Add slate type listItem if we are dealing with lists
  if (schema.nodes[SLATE_LIST_BLOCK_TYPE]) {
    schema.nodes[SLATE_LIST_ITEM_TYPE] = slateTypeComponentMapping.listItem
  }
  return {
    types: groupedTypes,
    schema: schema
  }
}
