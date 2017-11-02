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
    isSelected: PropTypes.bool,
    disabled: PropTypes.bool,
    autoComplete: PropTypes.string,
    hasError: PropTypes.bool,
    styles: PropTypes.shape({
      container: PropTypes.string,
      input: PropTypes.string,
      isClearable: PropTypes.string,
      focusHelper: PropTypes.string,
      clearButton: PropTypes.string,
      inputOnDisabled: PropTypes.string,
      inputOnError: PropTypes.string,
      containerOnError: PropTypes.string,
    })
  }

  static defaultProps = {
    value: '',
    type: 'text',
    isSelected: false,
    hasError: false,
    isClearable: false,
    disabled: false,
    autoComplete: 'off',
    onClear: NOOP,
    onFocus: NOOP,
    onBlur: NOOP,
    styles: {}
  }

  componentDidMount() {
    const {isSelected} = this.props
    this.setSelected(isSelected)
    // this.setState({hasFocus: this._input === document.activeElement})
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isSelected !== this.props.isSelected) {
      this.setSelected(nextProps.isSelected)
    }
  }

  select = () => {
    this._input.select()
  }

  focus = () => {
    this._input.focus()
  }

  setInputElement = element => {
    this._input = element
  }

  setSelected(isSelected) {
    if (isSelected) {
      this._input.select()
    }
  }

  render() {
    const {
      onClear,
      hasError,
      isClearable,
      disabled,
      isSelected,
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
          ref={this.setInputElement}
          {...rest}
          className={classNames(styles.input, [hasError && styles.inputOnError])}
          disabled={disabled}
        />
        <div className={styles.focusHelper} />
        {isClearable && (
          <button className={styles.clearButton} onClick={onClear}>
            <CloseIcon color="inherit" />
          </button>
        )}
      </div>
    )
  }
}
