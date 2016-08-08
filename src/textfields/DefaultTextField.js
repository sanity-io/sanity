import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textfields/default'
import lodash from 'lodash'

export default class DefaultTextField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onKeyPress: PropTypes.func,
    placeholder: PropTypes.string,
    onFocus: PropTypes.func,
    showClearButton: PropTypes.bool
  }

  static defaultProps = {
    value: '',
    onKeyPress() {},
    onChange() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      value: this.props.value
    }
  }

  handleChange(event) {
    const value = event.target.value
    this.setState({
      value: value
    })
    this.props.onChange(value)
  }

  handleKeyPress(event) {
    this.props.onKeyPress(event)
  }

  handleFocus() {
    // console.log('Focus')
    // this.props.onFocus()
  }

  componentWillMount() {
    this._inputId = lodash.uniqueId('DefaultTextField')
  }

  render() {
    const {label, placeholder, error, showClearButton} = this.props

    const rootClass = error ? styles.error : styles.root

    return (
      <div className={rootClass}>
        {
          label
          && <label
            htmlFor={this._inputId}
            className={`${error ? styles.errorLabel : styles.label}`}
             >
              {label}
          </label>
        }
        <input
          className={`${error ? styles.inputError : styles.input}`}
          id={this._inputId}
          type="text"
          onChange={this.handleChange}
          value={this.state.value}
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
