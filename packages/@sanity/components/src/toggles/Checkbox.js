import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/toggles/checkbox-style'

export default class Checkbox extends React.Component {
  static propTypes = {
    label: PropTypes.string,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    children: PropTypes.any,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
  }

  state = {
    hasFocus: false
  }

  componentDidMount() {
    if (typeof value === 'undefined' && this._input) {
      this._input.indeterminate = true
    }
  }

  handleFocus = event => {
    this.setState({hasFocus: true})
    if (this.props.onFocus) {
      this.props.onFocus(event)
    }
  }

  handleBlur = event => {
    this.setState({hasFocus: false})
    if (this.props.onBlur) {
      this.props.onBlur(event)
    }
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = el => {
    this._input = el
  }

  render() {
    const {disabled, checked, label, children, readOnly, ...rest} = this.props
    const {hasFocus} = this.state

    let checkedClass = checked ? styles.isChecked : styles.unChecked

    if (typeof checked === 'undefined') {
      checkedClass = styles.indeterminate
    }

    return (
      <label
        title={label}
        className={`
          ${disabled || readOnly ? styles.isDisabled : styles.isEnabled}
          ${checkedClass}
          ${disabled || readOnly ? styles.isDisabled : styles.isEnabled}
          ${checked ? styles.isChecked : styles.unChecked}
          ${hasFocus ? styles.hasFocus : ''}
        `}
        onBlur={this.handleBlur}
      >
        <input
          {...rest}
          className={styles.input}
          type="checkbox"
          disabled={disabled || readOnly}
          checked={checked}
          ref={this.setInput}
          onFocus={this.handleFocus}
        />
        <div className={styles.label}>
          {children || label}
        </div>

        <div className={styles.focusHelper} />
        <div className={styles.boxOutline}>
          <div className={styles.tickOutline} />
        </div>
        <div className={styles.tickHelper} />
        <div className={styles.rippleContainer} />
      </label>
    )
  }
}
