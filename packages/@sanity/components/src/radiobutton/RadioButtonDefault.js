import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/radiobutton/default-style'
import {uniqueId} from 'lodash'

export default class RadioButton extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    name: PropTypes.string,
    focus: PropTypes.bool
  }

  static defaultProps = {
    onChange() {}
  }

  componentWillMount() {
    this._inputId = uniqueId('RadioSelect')
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
    const {disabled, checked, label, name, focus} = this.props

    return (
      <label
        className={`
          ${styles.root}
          ${disabled ? styles.isDisabled : ''}
          ${checked ? styles.isChecked : styles.unChecked}
          ${focus ? styles.isFocused : ''}
        `}
        onMouseUp={this.handleMouseUp}
      >
        <input
          className={styles.input}
          type="radio"
          onChange={this.handleChange}
          checked={checked}
          id={this._inputId}
          name={name}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          disabled={disabled}
        />
        <div className={styles.label} htmlFor={this._inputId}>{label}</div>
        <div className={styles.circleOutline}>
          <div className={styles.tickOutline} />
        </div>
        <div className={styles.focusHelper} />
        <div className={styles.tickHelper} />
      </label>
    )
  }
}
