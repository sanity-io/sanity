import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/toggles/switch-style'

export default class Switch extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    focus: PropTypes.bool
  }

  static defaultProps = {
    onChange() {}
  }

  setInputElement = element => {
    this._inputElement = element
  }

  handleMouseUp = event => {
    this.handleBlur()
  }

  handleBlur = event => {
    window.setTimeout(() => {
      this.props.onBlur()
    }, 0.001)
  }

  render() {
    const {disabled, checked, onChange, onFocus, focus} = this.props

    return (
      <label
        className={`
          ${disabled ? styles.disabled : styles.enabled}
          ${checked ? styles.isChecked : styles.unchecked}
          ${focus ? styles.hasFocus : ''}
        `}
        onMouseUp={this.handleMouseUp}
      >
        <div className={styles.track} />


        <div className={`${checked ? styles.thumbChecked : styles.thumb}`}>
          <div className={styles.focusHelper} />
        </div>
        <input
          className={styles.input}
          type="checkbox"
          checked={checked}
          readOnly={disabled}
          onFocus={onFocus}
          onBlur={this.handleBlur}
          onChange={onChange}
        />
        <div className={styles.label}>
          {this.props.label}
        </div>

      </label>
    )
  }
}
