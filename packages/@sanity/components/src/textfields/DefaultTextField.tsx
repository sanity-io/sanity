import React from 'react'
import styles from 'part:@sanity/components/textfields/default-style'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import FormField from 'part:@sanity/components/formfields/default'

import {uniqueId} from 'lodash'

interface DefaultTextFieldProps {
  label: string
  id?: string
  type?: string
  onChange?: () => void
  onFocus?: () => void
  onBlur?: () => void
  onClear?: () => void
  onKeyPress?: () => void
  value?: string | number
  hasError?: boolean
  level?: number
  placeholder?: string
  isClearable?: boolean
  className?: string
  description?: string
  // hasFocus?: boolean
  // inputId?: string
}

// @todo: refactor to functional component
export default class DefaultTextField extends React.Component<DefaultTextFieldProps> {
  _inputId?: string

  handleClear = () => {
    if (this.props.onClear) this.props.onClear()
  }

  // eslint-disable-next-line camelcase
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
      level = 1,
      description,
      // hasFocus,
      onChange,
      onKeyPress,
      onFocus,
      onBlur,
      value = ''
      // inputId
    } = this.props

    return (
      <FormField
        className={`${hasError ? styles.hasError : styles.root} ${className || ''}`}
        level={level}
        labelFor={this._inputId}
        label={label}
        description={description}
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
        />
      </FormField>
    )
  }
}
