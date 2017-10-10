import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import classNames from 'classnames'

const NOOP = () => {}

const VALID_TYPES = [
  'color',
  'date',
  'email',
  'month',
  'password',
  'search',
  'tel',
  'text',
  'number',
  'url',
  'week',
]

export default class DefaultTextInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    type: PropTypes.oneOf(VALID_TYPES),
    onClear: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    isClearable: PropTypes.bool,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
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
    isDisabled: false,
    autoComplete: 'off',
    onClear: NOOP,
    onFocus: NOOP,
    onBlur: NOOP,
    styles: {}
  }

  state = {
    hasFocus: false
  }

  componentDidMount() {
    const {isSelected} = this.props
    this.setSelected(isSelected)
    this.setState({hasFocus: this._input === document.activeElement})
  }

  select = () => {
    this._input.select()
  }

  setInputElement = element => {
    this._input = element
  }

  setSelected(isSelected) {
    if (isSelected) {
      this.select()
    }
  }

  handleFocus = event => {
    this.props.onFocus(event)
    this.setState({hasFocus: true})
  }

  handleBlur = event => {
    this.props.onBlur(event)
    this.setState({hasFocus: false})
  }

  render() {
    const {
      onClear,
      hasError,
      isClearable,
      isDisabled,
      isSelected,
      styles,
      validation,
      ...rest
    } = this.props

    const {hasFocus} = this.state

    return (
      <div
        className={classNames(styles.container, [
          hasError && styles.containerOnError,
          isClearable && styles.isClearable,
          isDisabled && styles.isDisabled,
          hasFocus && styles.hasFocus,
        ])}
      >
        <input
          ref={this.setInputElement}
          {...rest}
          className={classNames(styles.input, [
            hasError && styles.inputOnError,
            isDisabled && styles.isDisabled,
            hasFocus && styles.hasFocus,
          ])}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          disabled={isDisabled}
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
