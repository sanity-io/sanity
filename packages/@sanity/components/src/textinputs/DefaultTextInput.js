import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/textinputs/default-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import {omit} from 'lodash'

export default class DefaultTextInput extends React.Component {
  static propTypes = {
    type: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyPress: PropTypes.func,
    onBlur: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.string,
    selected: PropTypes.bool,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    showClearButton: PropTypes.bool,
    id: PropTypes.string.isRequired,
    focus: PropTypes.bool
  }

  static defaultProps = {
    value: '',
    type: 'text',
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onClear() {},
    onBlur() {}
  }

  handleKeyPress = event => {
    this.props.onKeyPress(event)
  }

  selectInput = event => {
    // Triggers only when the input is focused
    this._input.setSelectionRange(0, this.props.value.length)
  }

  handleClear = event => {
    this.props.onClear(event)
  }

  setInputElement = element => {
    this._input = element
  }

  handleChange = event => {
    this.props.onChange(event)
  }

  componentDidMount() {
    const {selected, focus} = this.props
    if (focus && selected) {
      this.selectInput()
    }
  }

  componentDidUpdate() {
    const {selected, focus} = this.props
    if (focus && selected) {
      this.selectInput()
    }
  }

  render() {
    const {
      value,
      placeholder,
      error,
      showClearButton,
      id,
      type,
      level,
      onChange,
      onKeyPress,
      onFocus,
      onBlur,
      focus,
      disabled,
      ...rest
    } = omit(this.props, 'onClear')

    const rootClass = error ? styles.error : styles.root
    const levelClass = `styles[level_${level}]`

    return (
      <div className={rootClass}>
        <input
          {...rest}
          className={`
            ${error ? styles.inputError : styles.input}
            ${showClearButton ? styles.hasClearButton : ''}
            ${focus ? styles.hasFocus : ''}
            ${level ? levelClass : ''}
            ${disabled ? styles.disabled : ''}
          `}
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
          disabled={disabled}
          ref={this.setInputElement}
        />
        {
          showClearButton && (
            <button className={styles.clearButton} onClick={this.handleClear}>
              <CloseIcon color="inherit" />
            </button>
          )
        }
      </div>
    )
  }
}
