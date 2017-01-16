import fromSlate from '../../../src/inputs/BlockEditor-slate/conversion/fromSlate'
import toSlate, {DESERIALIZE} from '../../../src/inputs/BlockEditor-slate/conversion/toSlate'

import accessorForSlateValue from './SlateNodeAccessors/accessorForSlateValue'

const NODES_PATH = ['document', 'nodes']

function wrapItemValue(item, context) {
  return DESERIALIZE.node(item, context)
}
export default class SlateValueContainer {
  static deserialize(value, context) {
    const state = toSlate(value || [], context)

    return new SlateValueContainer(state, context)
  }

  constructor(state, context) {
    this.state = state
    this.context = context
  }

  validate() {
  }

  _getFieldDef(typeName) {
    return this.context.field.of.find(ofField => ofField.type === typeName)
  }

  _getItemContext(typeName) {
    return this.context.field.of.find(ofField => ofField.type === typeName)
  }

  isEmpty() {
    return this.state.document.length === 0
  }

  serialize() {
    return fromSlate(this.state, this.context)
  }

  // @sanity/mutator accessor interface

  containerType() {
    return 'array'
  }

  length() {
    return this.state.getIn(NODES_PATH).size
  }

  getIndex(index) {
    return accessorForSlateValue(this.state.getIn([...NODES_PATH, index]))
  }

  setIndex(index, item) {
    const nextState = this.state.setIn([...NODES_PATH, index], item)
    return new SlateValueContainer(nextState, this.context)
  }

  unsetIndices(indices) {
    const sorted = indices.slice().sort((index, otherIndex) => otherIndex - index)

    let nextState = this.state
    sorted.forEach(index => {
      nextState = nextState.deleteIn([...NODES_PATH, index])
    })

    return new SlateValueContainer(nextState, this.context)
  }

  insertItemsAt(pos, items) {

    const slateWrapped = items.map(item => item)

    const nodes = this.state.getIn(NODES_PATH)
    const nextNodes = nodes.splice(pos, 0, ...slateWrapped)

    const nextState = this.state.setIn(NODES_PATH, nextNodes)
    return new SlateValueContainer(nextState, this.context)
  }

  set(nextValue) {
    return new SlateValueContainer.deserialize(nextValue, this.context)
  }

  get() {
    return this.serialize()
  }
}
