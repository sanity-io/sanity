import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textinputs/default'
import {IoAndroidClose} from 'react-icons/lib/io'

export default class DefaultTextInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyPress: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    showClearButton: PropTypes.bool,
    id: PropTypes.string.isRequired
  }

  static defaultProps = {
    value: '',
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onClear() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.state = {
      value: this.props.value
    }
  }

  handleChange(event) {
    const value = event.target.value
    this.setState({
      value: value
    })
    this.props.onChange(event)
  }

  handleKeyPress(event) {
    this.props.onKeyPress(event)
  }

  handleFocus(event) {
    this.props.onFocus(event)
  }

  handleClear() {
    this.setState({
      value: ''
    })
    this.props.onClear()
  }

  render() {
    const {placeholder, error, showClearButton, id} = this.props

    const rootClass = error ? styles.error : styles.root

    return (
      <div className={rootClass}>
        <input
          className={`
            ${error ? styles.inputError : styles.input}
            ${showClearButton && styles.hasClearButton}
          `}
          id={id}
          type="text"
          onChange={this.handleChange}
          value={this.state.value}
          placeholder={placeholder}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
        />
        {
          showClearButton && <button className={styles.clearButton} onClick={this.handleClear}><IoAndroidClose color="inherit" /></button>
        }
      </div>
    )
  }
}
