import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/toggles/checkbox'

export default class Checkbox extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool
  }
  render() {
    const {disabled, checked} = this.props
    const rootStyle = disabled ? styles.disabled : styles.enabled
    const checkedStyle = checked ? styles.checked : styles.unchecked

    return (
      <label className={`${rootStyle} ${checkedStyle}`}>
        <div className={`${checked ? styles.thumbChecked : styles.thumb}`} />
        <input
          className={styles.input}
          type="checkbox"
          onChange={this.props.onChange}
          checked={this.props.checked}
        />
        <div className={styles.label}>{this.props.label}</div>
        <div className={styles.focusHelper} />
      </label>
    )
  }
}
