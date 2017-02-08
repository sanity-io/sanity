import {Raw} from 'slate'
import {createMemberValue} from '../../state/FormBuilderState'

import {SLATE_NORMAL_BLOCK_TYPE} from './constants'

const EMPTY_CONTENT = [{kind: 'block', type: SLATE_NORMAL_BLOCK_TYPE, nodes: []}]

function convertNodes(context, deserialized) {
  return deserialized.updateIn(['document', 'nodes'], nodes => {
    return nodes.map(node => {
      if (node.type === SLATE_NORMAL_BLOCK_TYPE) {
        return node
      }
      const memberType = context.type.of.find(ofType => ofType.name === node.type)
      return node.updateIn(['data', 'value'], value =>
        createMemberValue(value, {
          ...context,
          type: memberType
        })
      )
    })
  })
}

export default class SimpleSlateValueContainer {
  // Create a SlateValueContainer based on a document encoded as a Sanity value
  static deserialize(content, context) {
    const slateState = convertNodes(context, Raw.deserialize({
      kind: 'state',
      document: {
        kind: 'document',
        nodes: content || EMPTY_CONTENT
      }
    }))

    return new SimpleSlateValueContainer(slateState, context)
  }

  constructor(state, context) {
    this.state = state
    this.context = context
  }

  toJSON() {
    return this.serialize()
  }

  // Converts the contained document back from the Slate internal format to Sanity encoding
  serialize() {
    const serialized = Raw.serialize(this.state)
    return (serialized && serialized.document.nodes) || []
  }

  containerType() {
    return 'primitive'
  }

  setState(nextState) {
    return new SimpleSlateValueContainer(nextState, this.context)
  }

  get() {
    return this.serialize()
  }
}
