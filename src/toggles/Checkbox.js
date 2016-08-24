import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/toggles/checkbox'

export default class Checkbox extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool
  }

  static defaultProps = {
    onChange() {}
  }

  render() {
    const {disabled, checked} = this.props
    const disabledStyle = disabled ? styles.isDisabled : styles.isEnabled
    const checkedStyle = checked ? styles.isChecked : styles.unChecked

    return (
      <label className={`${styles.root} ${disabledStyle} ${checkedStyle}`}>
        <input
          className={styles.input}
          type="checkbox"
          onChange={this.props.onChange}
          checked={this.props.checked}
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
