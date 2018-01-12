import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/toggles/switch-style'

export default class Switch extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
  }

  state = {
    hasFocus: false
  }

  handleFocus = event => {
    this.setState({hasFocus: true})
    this.props.onFocus(event)
  }

  handleBlur = event => {
    this.setState({hasFocus: false})
    this.props.onBlur(event)
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = el => {
    this._input = el
    if (typeof value === 'undefined') {
      el.indeterminate = true
    }
  }

  render() {
    const {disabled, checked, label, ...rest} = this.props
    const {hasFocus} = this.state

    console.log(checked)

    let thumbClass = checked ? styles.thumbChecked : styles.thumb

    if (typeof checked === 'undefined') {
      thumbClass = styles.thumbUndefined
    }

    return (
      <label
        className={`
          ${typeof checked === 'undefined' ? styles.undefined : styles.root}
          ${disabled ? styles.isDisabled : styles.isEnabled}
          ${checked ? styles.isChecked : styles.unChecked}
          ${hasFocus ? styles.hasFocus : ''}
        `}
        onBlur={this.handleBlur}
      >
        <div className={styles.track} />
        <div className={thumbClass}>
          <div className={styles.focusHelper} />
        </div>

        <input
          {...rest}
          className={styles.input}
          type="checkbox"
          disabled={disabled}
          checked={checked}
          ref={this.setInput}
          onFocus={this.handleFocus}
        />
        <div className={styles.label}>
          {label}
        </div>

      </label>
    )
  }
}
