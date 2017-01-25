import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/toggles/switch-style'

export default class Switch extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool
  }

  static defaultProps = {
    onChange() {}
  }

  constructor(...args) {
    super(...args)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      isFocused: false
    }
  }

  handleChange(event) {
    this.props.onChange(event)
  }

  handleFocus = () => {
    this.setState({
      isFocused: true
    })
  }
  handleBlur = () => {
    this.setState({
      isFocused: false
    })
  }

  render() {
    const {disabled, checked} = this.props
    const {isFocused} = this.state

    return (
      <label
        className={`
          ${disabled ? styles.disabled : styles.enabled}
          ${checked ? styles.checked : styles.unchecked}
          ${isFocused ? styles.focused : ''}
        `}
      >
        <div className={styles.track}>
          <div className={styles.focusHelper} />
        </div>
        <div className={`${checked ? styles.thumbChecked : styles.thumb}`} />
        <input
          className={styles.input}
          type="checkbox"
          checked={checked}
          onChange={this.handleChange}
          readOnly={disabled}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        />
        <div className={styles.label}>
          {this.props.label}
        </div>

      </label>
    )
  }
}
