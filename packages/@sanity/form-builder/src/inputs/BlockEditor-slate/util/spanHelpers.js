import findComponentFromDOMNode from './findComponentFromDOMNode'
import {findDOMNode} from 'slate'

export function getSpanType(blockArrayType) {
  return getSpansField(blockArrayType)
    .type.of.find(type => type.name === 'span')
}

export function getSpansField(blockArrayType) {
  return getBlockField(blockArrayType)
    .fields.find(field => field.name === 'spans')
}

export function getBlockField(blockArrayType) {
  return blockArrayType.of.find(ofType => ofType.type.name === 'block')
}

// Opens a span components editing dialog from a Slate node input
export function openSpanDialog(spanNode) {
  const component = findComponentFromDOMNode(findDOMNode(spanNode))
  component.setState({isEditing: true})
}
