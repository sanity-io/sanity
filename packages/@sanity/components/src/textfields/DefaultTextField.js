import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/textfields/default-style'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'

import {uniqueId} from 'lodash'

export default class DefaultTextField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string,
    type: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onClear: PropTypes.func,
    onKeyPress: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    level: PropTypes.number,
    placeholder: PropTypes.string,
    showClearButton: PropTypes.bool,
    className: PropTypes.string,
    description: PropTypes.string,
    focus: PropTypes.bool
  }

  static defaultProps = {
    level: 0,
    value: '',
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onClear() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.state = {
      value: this.props.value
    }
  }

  handleChange(event) {
    this.props.onChange(event)
  }

  handleKeyPress(event) {
    this.props.onKeyPress(event)
  }

  handleFocus(event) {
    this.props.onFocus(event)
  }

  handleClear() {
    this.props.onClear()
  }

  componentWillMount() {
    this._inputId = this.props.id || uniqueId('DefaultTextField')
  }

  render() {
    const {label, placeholder, error, showClearButton, type, className, level, description, focus} = this.props

    const rootClass = `${error ? styles.error : styles.root} ${className}`
    return (
      <FormField className={rootClass} level={level} labelHtmlFor={this._inputId} label={label} description={description}>
        <DefaultTextInput
          className={`${error ? styles.inputError : styles.input}`}
          level={level}
          id={this._inputId}
          type={type}
          onChange={this.handleChange}
          value={this.props.value}
          placeholder={placeholder}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
          onClear={this.handleClear}
          showClearButton={showClearButton}
          focus={focus}
        />
      </FormField>
    )
  }
}
