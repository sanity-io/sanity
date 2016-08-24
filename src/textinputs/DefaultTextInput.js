import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textinputs/default'
import IoAndroidClose from 'icon:@sanity/close'

export default class DefaultTextInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyPress: PropTypes.func,
    type: PropTypes.string,
    onBlur: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.string,
    selected: PropTypes.bool,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    showClearButton: PropTypes.bool,
    id: PropTypes.string.isRequired,
    hasFocus: PropTypes.bool
  }

  static defaultProps = {
    value: '',
    type: 'text',
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onClear() {},
    onBlur() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.setInputElement = this.setInputElement.bind(this)
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

  handleSelect(event) {
    this._input.select()
  }

  handleClear(event) {
    // this.props.onChange(event)
    this.props.onClear(event)
  }

  setInputElement(element) {
    this._input = element
  }

  componentDidMount() {
    if (this.props.selected) {
      this.handleSelect()
    }
  }

  render() {
    const {value, placeholder, error, showClearButton, id, type, hasFocus, ...rest} = this.props

    const rootClass = error ? styles.error : styles.root

    return (
      <div className={rootClass}>
        <input
          {...rest}
          className={`
            ${error ? styles.inputError : styles.input}
            ${showClearButton && styles.hasClearButton}
            ${hasFocus && styles.hasFocus}
          `}
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          ref={this.setInputElement}
        />
        {
          showClearButton && <button className={styles.clearButton} onClick={this.handleClear}><IoAndroidClose color="inherit" /></button>
        }
      </div>
    )
  }
}
