import toSlate from './conversion/toSlate'
import fromSlate from './conversion/fromSlate'

import patchHandlers from './patchTypes'

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

  patch(patch) {
    // eslint-disable-next-line no-console
    console.log('patch', patch)

    let nextState
    if (patch.localState) {
      nextState = patch.localState
    } else {
      nextState = Object.keys(patch).reduce((state, key) => {
        const result = patchHandlers[key] ? patchHandlers[key](state, patch) : state
        return result === undefined ? state : result
      }, this.state)
    }
    return (nextState === this.state) ? this : new SlateValueContainer(nextState, this.context)
  }

  serialize() {
    return fromSlate(this.state)
  }
}
