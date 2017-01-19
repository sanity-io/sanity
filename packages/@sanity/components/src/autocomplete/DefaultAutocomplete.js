import React, {PropTypes} from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import styles from 'part:@sanity/components/autocomplete/default-style'
import List from 'part:@sanity/components/lists/default'

import {uniqueId} from 'lodash'

export default class DefaultAutocomplete extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onSelect: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onKeyPress: PropTypes.func,
    placeholder: PropTypes.string,
    focus: PropTypes.func,
    showClearButton: PropTypes.bool,
    isOpen: PropTypes.bool,
    id: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    ),
    suggestions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    )
  }

  static defaultProps = {
    value: '',
    onChange() {},
    onSelect() {},
    suggestions: []
  }

  constructor(props, context) {
    super(props, context)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleKeyPress() {
    // console.log('press')
  }

  handleSelect(item) {
    this.props.onSelect(item)
  }

  handleChange(event) {
    this.props.onChange(event)
  }

  componentWillMount() {
    this._inputId = this.props.id || uniqueId('Autocomplete')
  }

  render() {
    const {suggestions, label, value} = this.props

    const isOpen = suggestions.length > 1

    return (
      <FormField className={`${isOpen ? styles.opened : styles.closed}`} label={label} labelHtmlFor={this._inputId}>
        <div className={styles.input}>
          <TextInput
            id={this._inputId}
            value={value}
            onKeyPress={this.handleKeyPress}
            className={styles.textField}
            onChange={this.handleChange}
          />
        </div>
        <div className={styles.suggestionsContainer}>
          <List
            items={suggestions}
            className={styles.suggestions}
            onSelect={this.handleSelect}
          />
        </div>
      </FormField>
    )
  }
}
