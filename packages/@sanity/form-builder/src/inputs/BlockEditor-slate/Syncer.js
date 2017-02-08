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
    this.setState({value: value.setState(nextSlateState)})
    this.emitSet()
  }

  componentWillReceiveProps(nextProps) {
  }

  emitSet = throttle(() => {
    // const {onChange} = this.props
    const onChange = console.log
    const {value} = this.state
    onChange({
      patch: {
        type: 'set',
        value: value.serialize()
      }
    })
  }, 5 * 1000, {trailing: true})

  render() {
    const {value} = this.state
    return <BlockEditor {...this.props} onChange={this.handleChange} value={value.state} />
  }
}
