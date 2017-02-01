import React from 'react'
import {groupBy} from 'lodash'
import createPreviewNode from '../createFormBuilderPreviewNode'
import mapToObject from './mapToObject'
import Header from '../preview/Header'
import Paragraph from '../preview/Paragraph'
import List from '../preview/List'
import ListItem from '../preview/ListItem'
import Mark from '../preview/Mark'
import Link from '../preview/Link'
import {SLATE_MANAGED_NODE_TYPES} from '../constants'

// When the slate-fields are rendered in the editor, their node data is stored in a parent container component.
// In order to use the node data as props inside our components, we have to dereference them here first (see list and header keys)
const slateTypeComponentMapping = {
  paragraph: Paragraph,
  header(props) {
    // eslint-disable-next-line react/prop-types
    const level = props.children[0] && props.children[0].props.parent.data.get('level')
    return <Header level={level} {...props} />
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
    const listStyle = props.children[0] && props.children[0].props.parent.data.get('listStyle')
    return <List listStyle={listStyle} {...props} />
  },
  listItem: ListItem
}

export default function prepareSlateShema(type) {
  const groupedTypes = Object.assign({slate: [], formBuilder: []}, groupBy(type.of, ofType => {
    if (SLATE_MANAGED_NODE_TYPES.includes(ofType.style)) {
      return 'slate'
    }
    return 'formBuilder'
  }))
  const paragraphField = (groupedTypes.slate || []).find(ofType => ofType.style === 'paragraph')
  const allowedMarks = paragraphField && (paragraphField.marks || [])

  const schema = {
    nodes: Object.assign(
        mapToObject(groupedTypes.formBuilder || [], ofType => {
          return [ofType.name, createPreviewNode(ofType)]
        }),
        mapToObject(groupedTypes.slate || [], slateType => {
          const klass = slateTypeComponentMapping[slateType.style]
          if (klass) {
            return [slateType.style, klass]
          }
          throw new Error(`Do not know how to make a slate node for ${slateType.style}`)
        })
    ),
    marks: mapToObject(allowedMarks, mark => {
      return [mark, Mark]
    })
  }
  return {
    types: groupedTypes,
    schema: schema
  }
}
