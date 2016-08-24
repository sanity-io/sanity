import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textareas/default'
import IoAndroidClose from 'icon:@sanity/close'

export default class DefaultTextArea extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyPress: PropTypes.func,
    onBlur: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    showClearButton: PropTypes.bool,
    rows: PropTypes.number,
    id: PropTypes.string.isRequired
  }

  static defaultProps = {
    value: '',
    type: 'text',
    rows: 10,
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onClear() {},
    onBlur() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
  }

  handleChange(event) {
    this.props.onChange(event)
  }

  handleKeyPress(event) {
    this.props.onKeyPress(event)
  }

  handleFocus(event) {
    this.props.onFocus(event)
  }

  handleBlur(event) {
    this.props.onBlur(event)
  }

  handleClear(event) {
    this.props.onClear(event)
  }

  render() {
    const {value, placeholder, error, showClearButton, id, rows} = this.props

    const rootClass = error ? styles.error : styles.root

    return (
      <div className={rootClass}>
        <textarea
          className={`
            ${styles.textarea}
            ${error ? styles.inputError : styles.input}
            ${showClearButton && styles.hasClearButton}
          `}
          rows={rows}
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={this.handleChange}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        />
        {
          showClearButton && <button className={styles.clearButton} onClick={this.handleClear}><IoAndroidClose color="inherit" /></button>
        }
      </div>
    )
  }
}
