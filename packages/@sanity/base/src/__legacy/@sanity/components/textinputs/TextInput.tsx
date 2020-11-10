import classNames from 'classnames'
import CloseIcon from 'part:@sanity/base/close-icon'
import defaultStyles from 'part:@sanity/components/textinputs/default-style'
import React from 'react'
import {DefaultTextInputProps} from './types'

// @todo: refactor to functional component
export default class DefaultTextInput extends React.PureComponent<DefaultTextInputProps> {
  _input: HTMLInputElement | null = null

  componentDidMount() {
    if (this._input && typeof this.props.customValidity === 'string') {
      this._input.setCustomValidity(this.props.customValidity)
    }
  }

  // eslint-disable-next-line camelcase
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      hasError = false,
      isClearable = false,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      isSelected = false,
      disabled = false,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      markers,
      styles: stylesProp,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      customValidity,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      focusPath,
      inputId = '',
      value = '',
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
          value={value}
          id={inputId}
          ref={this.setInput}
          className={classNames(styles.input)}
          disabled={disabled}
        />

        {isClearable && (
          <button className={styles.clearButton} onClick={onClear} type="button">
            <CloseIcon />
          </button>
        )}
      </div>
    )
  }
}
