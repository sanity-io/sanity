import toSlate from './conversion/toSlate'
import fromSlate from './conversion/fromSlate'

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
    let nextState
    if (patch.type === 'localState') {
      nextState = patch.value
    } else {
      throw new Error(`Unknown patch type for block editor ${patch.type}`)
    }
    return (nextState === this.state) ? this : new SlateValueContainer(nextState, this.context)
  }

  isEmpty() {
    return this.state.document.length === 0
  }

  serialize() {
    return fromSlate(this.state, this.context)
  }
}
