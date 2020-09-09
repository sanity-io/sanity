import classNames from 'classnames'
import CloseIcon from 'part:@sanity/base/close-icon'
import defaultStyles from 'part:@sanity/components/textinputs/default-style'
import React from 'react'
import {DefaultTextInputProps} from './types'

export default class DefaultTextInput extends React.PureComponent<DefaultTextInputProps> {
  _input: HTMLInputElement | null = null

  componentDidMount() {
    if (this._input && typeof this.props.customValidity === 'string') {
      this._input.setCustomValidity(this.props.customValidity)
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: DefaultTextInputProps) {
    if (nextProps.customValidity !== this.props.customValidity) {
      if (this._input && typeof nextProps.customValidity === 'string') {
        this._input.setCustomValidity(nextProps.customValidity)
      }
    }
  }

  select() {
    if (this._input) {
      this._input.select()
    }
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (element: HTMLInputElement | null) => {
    this._input = element
  }

  render() {
    const {
      className: classNameProp,
      onClear,
      hasError = false,
      isClearable = false,
      isSelected = false,
      disabled = false,
      markers,
      styles: stylesProp,
      customValidity,
      focusPath,
      inputId = '',
      ...restProps
    } = this.props

    const styles = {...defaultStyles, ...stylesProp}

    return (
      <div
        className={classNames(
          styles.container,
          isClearable && styles.isClearable,
          disabled && styles.isDisabled,
          classNameProp
        )}
      >
        <input
          {...restProps}
          id={inputId}
          ref={this.setInput}
          className={classNames(styles.input)}
          disabled={disabled}
        />

        {isClearable && (
          <button className={styles.clearButton} onClick={onClear} type="button">
            <CloseIcon color="inherit" />
          </button>
        )}
      </div>
    )
  }
}
