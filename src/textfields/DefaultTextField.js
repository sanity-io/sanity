import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textfields/default'
import DefaultTextInput from 'component:@sanity/components/textinputs/default'
import FormField from 'component:@sanity/components/formfields/default'

import lodash from 'lodash'

export default class DefaultTextField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onClear: PropTypes.func,
    onKeyPress: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    showClearButton: PropTypes.bool
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
    this.props.onChange(event.target.value)
  }

  handleKeyPress(event) {
    this.props.onKeyPress(event)
  }

  handleFocus(event) {
    this.props.onFocus(event)
  }

  handleClear() {
    this.props.onClear()
  }

  componentWillMount() {
    this._inputId = lodash.uniqueId('DefaultTextField')
  }

  render() {
    const {label, placeholder, error, showClearButton, id} = this.props

    const rootClass = error ? styles.error : styles.root

    return (
      <FormField className={rootClass} id={id} label={label}>
        <DefaultTextInput
          className={`${error ? styles.inputError : styles.input}`}
          id={this._inputId}
          type="text"
          onChange={this.handleChange}
          value={this.props.value}
          placeholder={placeholder}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
          onClear={this.handleClear}
          showClearButton={showClearButton}
        />
      </FormField>
    )
  }
}
