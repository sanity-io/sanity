import {uniqueId} from 'lodash'
import styles from 'part:@sanity/components/autocomplete/default-style'
import FormField from 'part:@sanity/components/formfields/default'
import {List} from 'part:@sanity/components/lists/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import React from 'react'
import {AutocompleteSuggestionItem} from './types'

interface DefaultAutocompleteProps {
  id?: string
  label: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSelect?: (item: AutocompleteSuggestionItem) => void
  placeholder?: string
  suggestions?: AutocompleteSuggestionItem[]
  value?: string
}

// @todo: refactor to functional component
export default class DefaultAutocomplete extends React.PureComponent<DefaultAutocompleteProps> {
  _inputId?: string = undefined

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.props.onChange) this.props.onChange(event)
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this._inputId = this.props.id || uniqueId('Autocomplete')
  }

  render() {
    const {suggestions = [], label, placeholder, value = ''} = this.props
    const isOpen = suggestions.length > 1

    return (
      <FormField
        className={`${isOpen ? styles.opened : styles.closed}`}
        label={label}
        labelFor={this._inputId}
      >
        <TextInput
          inputId={this._inputId}
          value={value}
          className={styles.textField}
          placeholder={placeholder}
          onChange={this.handleChange}
        />
        <div className={styles.input} />
        <div className={styles.suggestionsContainer}>
          <List className={styles.suggestions} />
        </div>
      </FormField>
    )
  }
}
