import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textfields/default'

export default class DefaultTextField extends React.Component {
  static propTypes = {
    label: PropTypes.func,
    onChange: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onKeyPress: PropTypes.func,
    placeholder: PropTypes.string,
    focus: PropTypes.func
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      value: this.props.value
    }
  }

  handleChange() {
    this.props.onChange()
  }

  handleKeyPress() {
    this.props.onKeyPress()
  }

  handleFocus() {
    this.props.onFocus()
  }

  render() {
    const {label, value, placeholder, error, focus} = this.props

    // TODO generate an ID here
    const id = label

    return (
      <div className={styles.root}>
        {
          label && <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        }
        <input
          className={styles.input}
          id={id}
          type="text"
          onChange={this.handleChange}
          value={!!value}
          placeholder={placeholder}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
        />
      </div>
    )
  }
}
