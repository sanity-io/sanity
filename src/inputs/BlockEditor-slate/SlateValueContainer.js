// import toProseMirror from './conversion/toProseMirror'
// import fromProseMirror from './conversion/fromProseMirror'
import {Raw, Plain, Selection} from 'slate'
import prose from './prose'


import patchHandlers from './patchTypes'

export default class SlateValueContainer {
  static deserialize(value, context) {
    const state = value ? Raw.deserialize(value) : Plain.deserialize(prose)

    return new SlateValueContainer(state, context)
  }

  constructor(state, context) {
    this.state = state
    this.context = context
  }

  validate() {

  }

  patch(patch) {
    // eslint-disable-next-line no-console
    // console.log('patch', patch)

    if (patch.localState) {
      return new SlateValueContainer(patch.localState, this.context)
    }

    const nextState = Object.keys(patch).reduce((state, key) => {
      const result = patchHandlers[key] ? patchHandlers[key](state, patch) : state
      return result === undefined ? state : result
    }, this.state)

    return (nextState === this.state) ? this : new SlateValueContainer(nextState, this.context)
  }

  serialize() {
    return Raw.deserialize(this.state)
  }
}
