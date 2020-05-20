import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import SearchIcon from 'part:@sanity/base/search-icon'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'

import styles from './styles/SearchField.css'

class SearchField extends React.PureComponent {
  static propTypes = {
    hotkeys: PropTypes.arrayOf(PropTypes.string),
    isBleeding: PropTypes.bool,
    isFocused: PropTypes.bool,
    isOpen: PropTypes.bool,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onClear: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyDown: PropTypes.func,
    onMouseDown: PropTypes.func,
    placeholder: PropTypes.string,
    results: PropTypes.element,
    value: PropTypes.string.isRequired
  }

  static defaultProps = {
    hotkeys: undefined,
    isBleeding: false,
    isFocused: false,
    isOpen: false,
    onBlur: undefined,
    onChange: undefined,
    onClear: undefined,
    onFocus: undefined,
    onKeyDown: undefined,
    onMouseDown: undefined,
    placeholder: 'Search',
    results: null
  }

  inputElement = null

  setInputElement = ref => {
    this.inputElement = ref
  }

  render() {
    const {
      hotkeys,
      isBleeding,
      isFocused,
      isOpen,
      onBlur,
      onChange,
      onClear,
      onFocus,
      onKeyDown,
      onMouseDown,
      placeholder,
      results,
      value
    } = this.props
    let className = styles.root
    if (isBleeding) className += ` ${styles.isBleeding}`
    if (isFocused) className += ` ${styles.isFocused}`
    if (isOpen) className += ` ${styles.isOpen}`
    if (value.length) className += ` ${styles.hasValue}`

    return (
      <div className={className} onMouseDown={onMouseDown}>
        <div className={styles.inputField}>
          <label className={styles.label}>
            <SearchIcon />
          </label>
          <input
            className={styles.input}
            type="text"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            ref={this.setInputElement}
          />
          {hotkeys && (
            <div className={styles.hotkeys}>
              <Hotkeys keys={hotkeys} />
            </div>
          )}
          <div
            className={value ? styles.clearButtonWithValue : styles.clearButton}
            onClick={onClear}
            title="Clear search"
          >
            <CloseIcon />
          </div>
        </div>
        <div className={styles.results}>{results}</div>
      </div>
    )
  }
}

export default SearchField
