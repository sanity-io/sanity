import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/toggles/checkbox-style'
import {uniqueId} from 'lodash'

export default class Checkbox extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    focus: PropTypes.bool,
    value: PropTypes.string
  }

  static defaultProps = {
    onChange() {},
    onFocus() {},
    onBlur() {}
  }

  componentWillMount() {
    this._inputId = uniqueId('Checkbox')
  }

  handleMouseUp = event => {
    this.handleBlur()
  }

  handleChange = () => {
    this.props.onChange(this.props.item)
  }

  handleFocus = () => {
    this.props.onFocus(this.props.item)
  }

  handleBlur = () => {
    window.setTimeout(() => {
      this.props.onBlur(this.props.item)
    }, 0.001)
  }

  render() {
    const {disabled, checked, onChange, focus, value} = this.props

    return (
      <label
        htmlFor={this._inputId}
        className={`
          ${styles.root}
          ${disabled ? styles.isDisabled : styles.isEnabled}
          ${checked ? styles.isChecked : styles.unChecked}
          ${focus ? styles.hasFocus : ''}
        `}
        onMouseUp={this.handleMouseUp}
      >
        <input
          className={styles.input}
          type="checkbox"
          value={value}
          onChange={onChange}
          checked={checked}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          id={this._inputId}
        />
        <div className={styles.label}>{this.props.label}</div>

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
