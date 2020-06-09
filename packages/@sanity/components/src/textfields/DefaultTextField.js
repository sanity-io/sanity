import PropTypes from 'prop-types'
import React from 'react'
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
    hasError: PropTypes.bool,
    level: PropTypes.number,
    placeholder: PropTypes.string,
    isClearable: PropTypes.bool,
    className: PropTypes.string,
    description: PropTypes.string,
    hasFocus: PropTypes.bool,
    inputId: PropTypes.string
  }

  static defaultProps = {
    level: 1,
    value: '',
    hasFocus: false,
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onClear() {}
  }

  handleClear = () => {
    this.props.onClear()
  }

  UNSAFE_componentWillMount() {
    this._inputId = this.props.id || uniqueId('DefaultTextField')
  }

  render() {
    const {
      label,
      placeholder,
      hasError,
      isClearable,
      type,
      className,
      level,
      description,
      hasFocus,
      onChange,
      onKeyPress,
      onFocus,
      onBlur,
      value,
      inputId
    } = this.props

    return (
      <FormField
        className={`${hasError ? styles.hasError : styles.root} ${className || ''}`}
        level={level}
        labelFor={this._inputId}
        label={label}
        description={description}
        type={type}
        labelFor={this._inputId}
      >
        <DefaultTextInput
          className={styles.input}
          inputId={this._inputId}
          type={type}
          onChange={onChange}
          value={value}
          placeholder={placeholder}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          onClear={this.handleClear}
          isClearable={isClearable}
          hasError={hasError}
          hasFocus={hasFocus}
        />
      </FormField>
    )
  }
}
