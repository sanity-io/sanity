import React from 'react'
import styles from 'part:@sanity/components/textfields/search-style'
import {uniqueId} from 'lodash'

interface SearchFieldFieldProps {
  label: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  value?: string
}

// @todo: refactor to functional component
export default class SearchFieldField extends React.Component<SearchFieldFieldProps> {
  _inputId = uniqueId('searchfield')

  handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (this.props.onKeyPress) {
      this.props.onKeyPress(event)
    }
  }

  render() {
    const {label, placeholder, value = '', onChange, onFocus, onBlur, onKeyPress} = this.props

    return (
      <div className={styles.root}>
        {label && (
          <label htmlFor={this._inputId} className={styles.label}>
            {label}
          </label>
        )}
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
        />
      </div>
    )
  }
}
