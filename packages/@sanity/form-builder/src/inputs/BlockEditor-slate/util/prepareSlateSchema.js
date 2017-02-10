import React from 'react'
import createFormBuilderPreviewNode from '../createFormBuilderPreviewNode'
import mapToObject from './mapToObject'
import Header from '../preview/Header'
import Normal from '../preview/Normal'
import ListItem from '../preview/ListItem'
import Mark from '../preview/Mark'
import Link from '../preview/Link'

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
  listItem(props) {  // eslint-disable-line react/no-multi-comp
    // eslint-disable-next-line react/prop-types
    const listStyle = props.children[0] && props.children[0].props.parent.data.get('listItem')
    return <ListItem listStyle={listStyle} {...props} />
  }
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
    throw new Error(`No mapping for style '${style}' exists.`)
  }
  return component(props)
}

export default function prepareSlateShema(type) {
  const blockType = type.of.find(ofType => ofType.name === 'block')
  if (!blockType) {
    throw new Error("'block' type is not defined in the schema (required).")
  }

  const styleField = blockType.fields.find(btField => btField.name === 'style')
  if (!styleField) {
    throw new Error("A field with name 'style' is not defined in the block type (required).")
  }

  const textStyles = styleField.type.options.list
  if (!textStyles || textStyles.length === 0) {
    throw new Error('The style fields need at least one style '
      + "defined. I.e: {title: 'Normal', value: 'normal'}.")
  }

  const listField = blockType.fields.find(btField => btField.name === 'list')
  let listItems = []
  if (listField) {
    listItems = listField.type.options.list
  }

  const groupedTypes = {
    slate: [{
      type: 'contentBlock'
    }],
    formBuilder: type.of.filter(ofType => ofType.name !== 'block')
  }

  const allowedMarks = blockType.fields.find(btField => btField.name === 'spans')
    .type.of.find(of => of.name === 'span')
    .fields.find(field => field.name === 'marks')
    .type
    .options
    .list.map(mark => mark.value)

  const schema = {
    nodes: Object.assign(
        mapToObject(groupedTypes.formBuilder || [], ofType => {
          return [ofType.name, createFormBuilderPreviewNode(ofType)]
        }),
        {contentBlock: createSlatePreviewNode}
    ),
    marks: mapToObject(allowedMarks, mark => {
      return [mark, Mark]
    })
  }
  return {
    listItems: listItems,
    textStyles: textStyles,
    types: groupedTypes,
    schema: schema
  }
}
