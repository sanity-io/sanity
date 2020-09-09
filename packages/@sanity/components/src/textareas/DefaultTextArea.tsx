import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/textareas/default-style'
import IoAndroidClose from 'part:@sanity/base/close-icon'

const NOOP = () => {}
export default class DefaultTextArea extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyPress: PropTypes.func,
    onBlur: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.string,
    customValidity: PropTypes.string,
    isClearable: PropTypes.bool,
    rows: PropTypes.number,
    hasFocus: PropTypes.bool,
    disabled: PropTypes.bool,
    inputId: PropTypes.string
  }

  static defaultProps = {
    value: '',
    customValidity: '',
    rows: 10,
    isClearable: false,
    onKeyPress: NOOP,
    onChange: NOOP,
    onFocus: NOOP,
    onClear: NOOP,
    onBlur: NOOP
  }

  handleClear = event => {
    this.props.onClear(event)
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

  componentDidMount() {
    this._input.setCustomValidity(this.props.customValidity)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.customValidity !== this.props.customValidity) {
      this._input.setCustomValidity(nextProps.customValidity)
    }
  }

  render() {
    const {
      value,
      isClearable,
      rows,
      onKeyPress,
      onChange,
      onFocus,
      onBlur,
      onClear,
      customValidity,
      inputId,
      ...rest
    } = this.props

    return (
      <div className={styles.root}>
        <textarea
          id={inputId}
          className={styles.textarea}
          rows={rows}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
          ref={this.setInput}
          {...rest}
        />
        {isClearable && !this.props.disabled && (
          <button type="button" className={styles.clearButton} onClick={onClear}>
            <IoAndroidClose color="inherit" />
          </button>
        )}
      </div>
    )
  }
}
