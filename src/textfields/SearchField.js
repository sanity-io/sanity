import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textfields/search'
import {uniqueId} from 'lodash'

export default class SearchFieldField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onKeyPress: PropTypes.func,
    placeholder: PropTypes.string,
    focus: PropTypes.func
  }

  static defaultProps = {
    value: '',
    onKeyPress() {},
    onChange() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
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

  componentWillMount() {
    this._inputId = uniqueId('searchfield')
  }

  render() {
    const {label, placeholder} = this.props
    const {value} = this.state

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
          onChange={this.handleChange}
          value={value}
          placeholder={placeholder}
          onKeyPress={this.handleKeyPress}
          onFocus={this.handleFocus}
        />
      </div>
    )
  }
}
