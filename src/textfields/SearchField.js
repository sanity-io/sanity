import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/textfields/search'
import lodash from 'lodash'

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

  componentWillMount() {
    this._inputId = lodash.uniqueId('searchfield')
  }

  render() {
    const {label, value, placeholder} = this.props

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
