import React from 'react'
import {groupBy} from 'lodash'
import createPreviewNode from '../createFormBuilderPreviewNode'
import mapToObject from './mapToObject'
import Header from '../preview/Header'
import Paragraph from '../preview/Paragraph'
import List from '../preview/List'
import ListItem from '../preview/ListItem'
import Mark from '../preview/Mark'
import {SLATE_MANAGED_NODE_TYPES} from '../constants'

// When the slate-fields are rendered in the editor, their node data is stored in a parent container component.
// In order to use the node data as props inside our components, we have to dereference them here first (see list and header keys)
const slateFieldComponentMapping = {
  paragraph: Paragraph,
  header(props) {
    // eslint-disable-next-line react/prop-types
    const level = props.children[0] && props.children[0].props.parent.data.get('level')
    return <Header level={level} {...props} />
  },
  list(props) { // eslint-disable-line react/no-multi-comp
    // eslint-disable-next-line react/prop-types
    const listStyle = props.children[0] && props.children[0].props.parent.data.get('listStyle')
    return <List listStyle={listStyle} {...props} />
  },
  listItem: ListItem
}

export default function prepareSlateShema(field) {
  const groupedFields = Object.assign({slate: [], formBuilder: []}, groupBy(field.of, ofField => {
    if (SLATE_MANAGED_NODE_TYPES.includes(ofField.type)) {
      return 'slate'
    }
    return 'formBuilder'
  }))

  const paragraphField = (groupedFields.slate || []).find(ofField => ofField.type === 'paragraph')
  const allowedMarks = paragraphField && (paragraphField.marks || [])

  const schema = {
    nodes: Object.assign(
        mapToObject(groupedFields.formBuilder || [], ofField => {
          return [ofField.type, createPreviewNode(ofField)]
        }),
        mapToObject(groupedFields.slate || [], slateField => {
          const klass = slateFieldComponentMapping[slateField.type]
          if (klass) {
            return [slateField.type, klass]
          }
          throw new Error(`Do not know how to make a slate node for ${slateField.type}`)
        })
    ),
    marks: mapToObject(allowedMarks, mark => {
      return [mark, Mark]
    })
  }
  return {
    fields: groupedFields,
    schema: schema
  }
}
