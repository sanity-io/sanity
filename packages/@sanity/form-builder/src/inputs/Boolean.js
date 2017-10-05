import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import PatchEvent, {set} from '../PatchEvent'

// Todo: support indeterminate state, see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
export default class BooleanInput extends React.Component {

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.bool,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  handleChange = event => {
    this.props.onChange(PatchEvent.from(set(event.target.checked)))
  }

  render() {
    const {value, type, validation, ...rest} = this.props

    const isCheckbox = type.options && type.options.layout === 'checkbox'
    return isCheckbox
      ? <Checkbox
        {...rest}
        onChange={this.handleChange}
        checked={!!value}
        description={type.description}
      >
        {type.title}
      </Checkbox>
      : <Switch
        {...rest}
        onChange={this.handleChange}
        checked={!!value}
        label={type.title}
        description={type.description}
      />
  }
}
