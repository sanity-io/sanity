import React, {PropTypes} from 'react'
import BlockEditor from './BlockEditor'
import {Raw} from 'slate'
import sanityToSlateRaw from './conversion/sanityToSlateRaw'
import slateRawToSanity from './conversion/slateRawToSanity'
import {throttle} from 'lodash'
import PatchEvent, {set, unset} from '../../PatchEvent'

function deserialize(value, type) {
  return Raw.deserialize(sanityToSlateRaw(value, type))
}
function serialize(state) {
  return slateRawToSanity(Raw.serialize(state))
}

export default class Syncer extends React.PureComponent {
  static propTypes = {
    value: PropTypes.array.isRequired,
    type: PropTypes.object.isRequired,
    onChange: PropTypes.func
  }

  constructor(props) {
    super()
    this.state = {
      value: deserialize(props.value, props.type)
    }
  }

  handleChange = nextSlateState => {
    this.setState({value: nextSlateState}, this.emitSet)
  }

  componentWillReceiveProps(nextProps) {
  }

  componentWillUnmount() {
    // This is a defensive workaround for an issue causing content to be overwritten
    // It cancels any pending saves, so if the component gets unmounted within the
    // 1 second window, work may be lost.
    // This is by no means ideal, but preferable to overwriting content in other documents
    // Should be fixed by making the block editor "real" realtime
    this.emitSet.cancel()
  }

  emitSet = throttle(() => {
    const {onChange} = this.props
    // const onChange = event => console.log(event.patch.type, event.patch.value)
    const {value} = this.state
    const nextVal = serialize(value)

    onChange(PatchEvent.from(nextVal ? set(nextVal) : unset()))

  }, 1000, {trailing: true})

  render() {
    const {value} = this.state
    return <BlockEditor {...this.props} onChange={this.handleChange} value={value} />
  }
}
