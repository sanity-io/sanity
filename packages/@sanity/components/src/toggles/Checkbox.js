import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/toggles/checkbox-style'

export default class Checkbox extends React.Component {
  static propTypes = {
    value: PropTypes.bool,
    label: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    hasFocus: PropTypes.bool,
    children: PropTypes.node
  }

  static defaultProps = {
    onChange() {},
    onFocus() {},
    onBlur() {}
  }

  state = {
    hasFocus: false
  }

  handleMouseUp = () => {
    this.setState({hasFocus: false})
  }

  handleFocus = () => {
    this.setState({hasFocus: true})
  }

  handleChange = event => {
    this.props.onChange(event, this.props.value)
  }

  handleBlur = () => {
    window.setTimeout(() => {
      this.props.onBlur(this.props.value)
    }, 0.001)
  }

  render() {
    const {disabled, hasFocus, value, checked, label, children} = this.props

    return (
      <label
        title={label}
        className={`
          ${styles.root}
          ${disabled ? styles.isDisabled : styles.isEnabled}
          ${checked ? styles.isChecked : styles.unChecked}
          ${hasFocus ? styles.hasFocus : ''}
        `}
        onMouseUp={this.handleMouseUp}
      >
        <input
          className={styles.input}
          type="checkbox"
          value={String(value)}
          onChange={this.handleChange}
          checked={checked}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
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
