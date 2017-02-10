import {Raw} from 'slate'
import sanityToSlateRaw from './conversion/sanityToSlateRaw'
import slateRawToSanity from './conversion/slateRawToSanity'

export default class SimpleSlateValueContainer {
  // Create a SlateValueContainer based on a document encoded as a Sanity value
  static deserialize(content, context) {
    const slateState = Raw.deserialize(sanityToSlateRaw(content, context))
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
    return slateRawToSanity(Raw.serialize(this.state))
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
