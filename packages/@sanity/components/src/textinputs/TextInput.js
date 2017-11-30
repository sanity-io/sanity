import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import classNames from 'classnames'
import defaultStyles from 'part:@sanity/components/textinputs/default-style'

const NOOP = () => {}

export default class DefaultTextInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    type: PropTypes.string,
    onClear: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    isClearable: PropTypes.bool,
    disabled: PropTypes.bool,
    autoComplete: PropTypes.string,
    hasError: PropTypes.bool,
    styles: PropTypes.shape({
      container: PropTypes.string,
      input: PropTypes.string,
      isClearable: PropTypes.string,
      clearButton: PropTypes.string,
      inputOnDisabled: PropTypes.string,
      inputOnError: PropTypes.string,
      containerOnError: PropTypes.string,
    })
  }

  static defaultProps = {
    value: '',
    type: 'text',
    hasError: false,
    isClearable: false,
    disabled: false,
    autoComplete: 'off',
    onClear: NOOP,
    onFocus: NOOP,
    onBlur: NOOP,
    styles: {}
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

  setInput = element => {
    this._input = element
  }

  render() {
    const {
      onClear,
      hasError,
      isClearable,
      disabled,
      styles: passedStyles,
      ...rest
    } = this.props

    const styles = {
      ...defaultStyles,
      ...passedStyles
    }

    return (
      <div
        className={classNames(styles.container, [
          hasError && styles.containerOnError,
          isClearable && styles.isClearable,
          disabled && styles.isDisabled
        ])}
      >
        <input
          ref={this.setInput}
          {...rest}
          className={classNames(styles.input, [hasError && styles.inputOnError])}
          disabled={disabled}
        />
        {isClearable && (
          <button className={styles.clearButton} onClick={onClear}>
            <CloseIcon color="inherit" />
          </button>
        )}
      </div>
    )
  }
}
