import {uniqueId} from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import styles from 'part:@sanity/components/autocomplete/default-style'
import {List} from 'part:@sanity/components/lists/default'

const noop = () => undefined

export default class DefaultAutocomplete extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string,
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onSelect: PropTypes.func,
    suggestions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    ),
    value: PropTypes.string
  }

  static defaultProps = {
    id: undefined,
    onChange: noop,
    onSelect: noop,
    suggestions: [],
    value: ''
  }

  constructor(props, context) {
    super(props, context)

    this.handleSelect = this.handleSelect.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleSelect(item) {
    this.props.onSelect(item)
  }

  handleChange(event) {
    this.props.onChange(event)
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this._inputId = this.props.id || uniqueId('Autocomplete')
  }

  render() {
    const {suggestions, label, value} = this.props
    const isOpen = suggestions.length > 1

    return (
      <FormField
        className={`${isOpen ? styles.opened : styles.closed}`}
        label={label}
        labelFor={this._inputId}
      >
        <TextInput
          id={this._inputId}
          value={value}
          className={styles.textField}
          onChange={this.handleChange}
        />
        <div className={styles.input} />
        <div className={styles.suggestionsContainer}>
          <List items={suggestions} className={styles.suggestions} onSelect={this.handleSelect} />
        </div>
      </FormField>
    )
  }
}
