import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/toggles/checkbox-style'

export default class Checkbox extends React.Component {
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
    onChange() {},
    onFocus() {},
    onBlur() {}
  }

  render() {
    const {disabled, checked, onChange, onFocus, onBlur, focus} = this.props

    return (
      <label
        className={`
          ${styles.root}
          ${disabled ? styles.isDisabled : styles.isEnabled}
          ${checked ? styles.isChecked : styles.unChecked}
          ${focus ? styles.isFocused : ''}
        `}
      >
        <input
          className={styles.input}
          type="checkbox"
          onChange={onChange}
          checked={checked}
          onFocus={onFocus}
          onBlur={onBlur}
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
