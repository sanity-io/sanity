import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import classNames from 'classnames'
import defaultStyles from 'part:@sanity/components/textinputs/default-style'

const NOOP = () => {}

export default class DefaultTextInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    markers: PropTypes.array,
    focusPath: PropTypes.array,
    type: PropTypes.string,
    onClear: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    isClearable: PropTypes.bool,
    isSelected: PropTypes.bool,
    disabled: PropTypes.bool,
    autoComplete: PropTypes.string,
    hasError: PropTypes.bool,
    customValidity: PropTypes.string,
    styles: PropTypes.shape({
      container: PropTypes.string,
      input: PropTypes.string,
      isClearable: PropTypes.string,
      isDisabled: PropTypes.string,
      clearButton: PropTypes.string,
      inputOnDisabled: PropTypes.string,
      inputOnError: PropTypes.string,
      containerOnError: PropTypes.string
    }),
    inputId: PropTypes.string
  }

  static defaultProps = {
    value: '',
    type: 'text',
    hasError: false,
    isSelected: false,
    isClearable: false,
    disabled: false,
    autoComplete: 'off',
    onClear: NOOP,
    onFocus: NOOP,
    onBlur: NOOP,
    styles: {},
    customValidity: '',
    inputId: ''
  }

  componentDidMount() {
    this._input.setCustomValidity(this.props.customValidity)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.customValidity !== this.props.customValidity) {
      this._input.setCustomValidity(nextProps.customValidity)
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

  setInput = element => {
    this._input = element
  }

  render() {
    const {
      onClear,
      hasError,
      isClearable,
      isSelected,
      disabled,
      markers,
      styles: passedStyles,
      customValidity,
      focusPath,
      inputId,
      ...rest
    } = this.props

    const styles = {
      ...defaultStyles,
      ...passedStyles
    }

    return (
      <div
        className={classNames(styles.container, [
          isClearable && styles.isClearable,
          disabled && styles.isDisabled
        ])}
      >
        <input
          id={inputId}
          ref={this.setInput}
          {...rest}
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
