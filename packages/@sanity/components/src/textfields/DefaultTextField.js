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
    onBlur: PropTypes.func,
    onClear: PropTypes.func,
    onKeyPress: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error: PropTypes.bool,
    level: PropTypes.number,
    placeholder: PropTypes.string,
    isClearable: PropTypes.bool,
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

  handleClear = () => {
    this.props.onClear()
  }

  componentWillMount() {
    this._inputId = this.props.id || uniqueId('DefaultTextField')
  }

  render() {
    const {
      label,
      placeholder,
      error,
      isClearable,
      type,
      className,
      level,
      description,
      focus,
      onChange,
      onKeyPress,
      onFocus,
      onBlur,
      value
    } = this.props

    return (
      <FormField
        className={`${error ? styles.error : styles.root} ${className || ''}`}
        level={level}
        labelHtmlFor={this._inputId}
        label={label}
        description={description}
      >
        <DefaultTextInput
          className={`${error ? styles.inputError : styles.input}`}
          level={level}
          id={this._inputId}
          type={type}
          onChange={onChange}
          value={value}
          placeholder={placeholder}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          onClear={this.handleClear}
          isClearable={isClearable}
          focus={focus}
        />
      </FormField>
    )
  }
}
