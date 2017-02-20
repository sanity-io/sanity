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

export function openSpanDialog(spanNode) {
  // Simulate mouseup on the node to open dialog
  const mouseUpEvent = document.createEvent('MouseEvents')
  mouseUpEvent.initEvent('mouseup', true, true)
  findDOMNode(spanNode).dispatchEvent(mouseUpEvent)
}
