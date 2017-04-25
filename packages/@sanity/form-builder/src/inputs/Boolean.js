import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import PatchEvent, {set} from '../PatchEvent'

// Todo: support indeterminate state, see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
export default class Bool extends React.Component {
  static displayName = 'Boolean';

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.bool,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  constructor() {
    super()
    this.state = {
      hasFocus: false
    }
  }

  handleChange = event => {
    this.props.onChange(PatchEvent.from(set(event.target.checked)))
  }

  handleFocus = event => {
    this.setState({
      hasFocus: true
    })
  }

  handleBlur = event => {
    this.setState({
      hasFocus: false
    })
  }

  render() {
    const {value, type} = this.props
    const {hasFocus} = this.state

    if (type.options && type.options.layout === 'checkbox') {
      return (
        <Checkbox
          onChange={this.handleChange}
          checked={!!value}
          label={type.title}
          description={type.description}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          hasFocus={hasFocus}
        />
      )
    }

    return (
      <Switch
        onChange={this.handleChange}
        checked={!!value}
        label={type.title}
        description={type.description}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        hasFocus={hasFocus}
      />
    )
  }
}
