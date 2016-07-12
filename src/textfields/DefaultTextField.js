import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textfields/default'

export default class DefaultTextField extends React.Component {
  static propTypes = {
    label: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onKeyPress: PropTypes.func,
    placeholder: PropTypes.string,
    focus: PropTypes.func,
    showClearButton: PropTypes.bool
  }

  static defaultProps = {
    value: ''
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
    console.log('Focus')
    // this.props.onFocus()
  }

  render() {
    const {label, value, placeholder, error, focus, showClearButton} = this.props

    // TODO generate an ID here
    const id = label

    const rootClass = error ? styles.error : styles.root

    return (
      <div className={rootClass}>
        {
          label
          && <label
            htmlFor={id}
            className={`${error ? styles.errorLabel : styles.label}`}
             >
              {label}
          </label>
        }
        <input
          className={`${error ? styles.inputError : styles.input}`}
          id={id}
          type="text"
          onChange={this.handleChange}
          value={value}
          placeholder={placeholder}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
        />
      {
        showClearButton && <button className={styles.clearButton} />
      }
      </div>
    )
  }
}
