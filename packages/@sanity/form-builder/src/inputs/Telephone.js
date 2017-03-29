import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import TextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'
import {uniqueId} from 'lodash'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class TelephoneInput extends React.PureComponent {
  static displayName = 'Telephone';

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    hasFocus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {},
    onEnter() {}
  }

  state = {
    hasFocus: this.props.hasFocus
  }

  _inputId = uniqueId('TelephoneInput')

  handleChange = event => {
    const value = event.target.value || undefined
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  handleFocus = () => {
    this.setState({
      hasFocus: true
    })
  }

  handleBlur = () => {
    this.setState({
      hasFocus: false
    })
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, type, level} = this.props
    const {hasFocus} = this.state

    return (
      <FormField
        level={level}
        labelHtmlFor={this._inputId}
        label={type.title}
        description={type.description}
      >
        <TextInput
          type="text"
          value={value}
          id={this._inputId}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          hasFocus={hasFocus}
        />
      </FormField>
    )
  }
}
