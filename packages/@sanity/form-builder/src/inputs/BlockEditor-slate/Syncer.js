import React, {PropTypes} from 'react'
import {Raw} from 'slate'
import BlockEditor from './BlockEditor'
import {throttle} from 'lodash'
import {SLATE_NORMAL_BLOCK_TYPE} from './constants'

const EMPTY_CONTENT = [{kind: 'block', type: SLATE_NORMAL_BLOCK_TYPE, nodes: []}]

export default class Syncer extends React.PureComponent {
  static propTypes = {
    value: PropTypes.array,
    onChange: PropTypes.func
  }

  constructor(props) {
    super()
    this.state = {
      slateState: Raw.deserialize({
        nodes: props.value || EMPTY_CONTENT
      }, {terse: true})
    }
  }

  handleChange = nextSlateState => {
    this.setState({slateState: nextSlateState})
    this.emitSet()
  }

  emitSet = throttle(() => {
    const {onChange} = this.props
    const serialized = Raw.serialize(this.state.slateState, {terse: true})
    onChange({
      patch: {
        type: 'set',
        value: (serialized && serialized.nodes) || []
      }
    })
  }, 5 * 1000, {trailing: true})

  render() {
    const {slateState} = this.state
    return <BlockEditor {...this.props} onChange={this.handleChange} value={slateState} />
  }
}
