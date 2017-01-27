import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/textfields/search-style'
import {uniqueId} from 'lodash'

export default class SearchFieldField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,

    onChange: PropTypes.func,
    onKeyPress: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,

    placeholder: PropTypes.string,
    focus: PropTypes.bool
  }

  static defaultProps = {
    value: '',
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onBlur() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  handleChange(event) {
    const value = event.target.value
    this.props.onChange(value)
  }

  handleKeyPress(event) {
    this.props.onKeyPress(event)
  }

  componentWillMount() {
    this._inputId = uniqueId('searchfield')
  }

  render() {
    const {
      label,
      placeholder,
      value,
      focus,
      onChange,
      onFocus,
      onBlur,
      onKeyPress
    } = this.props

    return (
      <div className={styles.root}>
        {
          label && <label htmlFor={this._inputId} className={styles.label}>
            {label}
          </label>
        }
        <input
          className={styles.input}
          id={this._inputId}
          type="search"
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          value={value}
          placeholder={placeholder}
          onKeyPress={onKeyPress}
          focus={focus}
        />
      </div>
    )
  }
}
