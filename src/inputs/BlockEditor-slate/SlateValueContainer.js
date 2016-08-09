// import toProseMirror from './conversion/toProseMirror'
// import fromProseMirror from './conversion/fromProseMirror'
import {Raw, Plain} from 'slate'


export default class SlateValueContainer {
  static deserialize(value, context) {

    const state = value ? Raw.deserialize(value) : Plain.deserialize('')

    return new SlateValueContainer(state, context)
  }

  constructor(state, context) {
    this.state = state
    this.context = context
  }

  validate() {

  }

  patch(patch) {
    if (patch.localState) {
      return new SlateValueContainer(patch.localState, this.context)
    }
    return this
  }

  serialize() {
    return Raw.deserialize(this.state)
  }
}
