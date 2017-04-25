import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class Url extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.string,
    onChange: PropTypes.func,
    hasFocus: PropTypes.bool
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange = event => {
    const value = event.target.value || undefined
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  render() {
    const {value, type, hasFocus} = this.props
    return (
      <DefaultTextField
        label={type.title}
        description={type.description}
        type="url"
        placeholder={type.placeholder}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        value={value}
        hasFocus={hasFocus}
      />
    )
  }
}
