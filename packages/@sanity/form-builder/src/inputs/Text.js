import PropTypes from 'prop-types'
// @flow weak
import React from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
import {uniqueId} from 'lodash'
import PatchEvent, {set, unset} from '../PatchEvent'

export default class Text extends React.PureComponent {

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  state = {
    hasFocus: false
  }

  _inputId = uniqueId('Text')

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

  handleChange = event => {
    const value = event.target.value || undefined
    this.props.onChange(PatchEvent.from(value ? set(value) : unset()))
  }

  render() {
    const {value, type, level} = this.props
    const {hasFocus} = this.state
    return (
      <FormField label={type.title} labelHtmlFor={this._inputId} level={level} description={type.description}>
        <TextArea
          id={this._inputId}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          hasFocus={hasFocus}
          rows={type.rows}
          value={value}
        />
      </FormField>
    )
  }
}
