import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/toggles/switch-style'

export default class Switch extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    markers: PropTypes.array,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    readOnly: PropTypes.bool
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
  }

  render() {
    const {disabled, markers, checked, label, readOnly, ...rest} = this.props
    const {hasFocus} = this.state

    let thumbClass = checked ? styles.thumbChecked : styles.thumb

    if (typeof checked === 'undefined') {
      thumbClass = styles.thumbIndeterminate
    }

    return (
      <label
        className={`
          ${disabled || readOnly ? styles.isDisabled : styles.isEnabled}
          ${typeof checked === 'undefined' ? styles.indeterminate : styles.root}
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
          disabled={disabled || readOnly}
          checked={checked}
          ref={this.setInput}
          onFocus={this.handleFocus}
        />
        <div className={styles.label}>{label}</div>
      </label>
    )
  }
}
