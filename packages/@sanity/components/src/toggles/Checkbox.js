import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/toggles/checkbox-style'

export default class Checkbox extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool
  }

  state = {
    isFocused: false
  }

  static defaultProps = {
    onChange() {},
    onFocus() {},
    onBlur() {}
  }

  handleFocus = () => {
    this.setState({
      isFocused: true
    })
    this.props.onFocus()
  }

  handleBlur = () => {
    this.setState({
      isFocused: false
    })
    this.props.onBlur()
  }

  render() {
    const {disabled, checked} = this.props
    const {isFocused} = this.state

    return (
      <label
        className={`
          ${styles.root}
          ${disabled ? styles.isDisabled : styles.isEnabled}
          ${checked ? styles.isChecked : styles.unChecked}
          ${isFocused ? styles.isFocused : ''}
        `}
      >
        <input
          className={styles.input}
          type="checkbox"
          onChange={this.props.onChange}
          checked={this.props.checked}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
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
