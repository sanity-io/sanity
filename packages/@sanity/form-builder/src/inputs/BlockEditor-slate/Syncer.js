import React, {PropTypes} from 'react'
import BlockEditor from './BlockEditor'
import {throttle} from 'lodash'
import SimpleSlateValueContainer from './SimpleSlateValueContainer'

export default class Syncer extends React.PureComponent {
  static valueContainer = SimpleSlateValueContainer;
  static propTypes = {
    value: PropTypes.instanceOf(SimpleSlateValueContainer).isRequired,
    onChange: PropTypes.func
  }

  constructor(props) {
    super()
    this.state = {
      value: props.value
    }
  }

  handleChange = nextSlateState => {
    const {value} = this.state
    this.setState({value: value.setState(nextSlateState)}, this.emitSet)
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
    const nextVal = value.serialize()

    const patch = nextVal
      ? {type: 'set', value: nextVal}
      : {type: 'unset'}

    onChange({patch})

  }, 1000, {trailing: true})

  render() {
    const {value} = this.state
    return <BlockEditor {...this.props} onChange={this.handleChange} value={value.state} />
  }
}
