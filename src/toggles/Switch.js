import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/toggles/switch'

export default class Switch extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool
  }

  constructor(...args) {
    super(...args)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      checked: this.props.checked
    }
  }

  handleChange(event) {
    this.setState({
      checked: !this.state.checked
    })
    this.props.onChange(event)
  }

  render() {
    const {disabled} = this.props
    const {checked} = this.state
    const rootStyle = disabled ? styles.disabled : styles.enabled
    const checkedStyle = checked ? styles.checked : styles.unchecked

    return (
      <label className={`${rootStyle} ${checkedStyle}`}>
        <div className={styles.track} />
        <div className={`${checked ? styles.thumbChecked : styles.thumb}`} />
        <input
          className={styles.input}
          type="checkbox"
          checked={checked}
          onChange={this.handleChange}
        />
        <div className={styles.label}>{this.props.label}</div>
        <div className={styles.focusHelper} />
      </label>
    )
  }
}
