import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import {uniqueId} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import CloseIcon from 'part:@sanity/base/close-icon'
import enhanceWithClickOutside from 'react-click-outside'
import SelectMenu from './SelectMenu'

const noop = () => {}

class StatelessSearchableSelect extends React.PureComponent {
  static propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.any,

    inputValue: PropTypes.string,
    onInputChange: PropTypes.func,

    onClear: PropTypes.func,
    renderItem: PropTypes.func,
    placeholder: PropTypes.string,

    isLoading: PropTypes.bool,

    isOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,

    items: PropTypes.array,

    highlightIndex: PropTypes.number,
    onHighlightIndexChange: PropTypes.func,

    isInputSelected: PropTypes.bool
  }

  static defaultProps = {
    onChange: noop,
    onOpen: noop,
    onClose: noop,
    level: 0,
    onInputChange: noop,
    hasError: false,
    isLoading: false,
    renderItem: item => item,
    items: []
  }

  handleClickOutside = () => {
    this.props.onClose()
  }

  handleSelect = item => {
    this.props.onChange(item)
  }

  handleArrowClick = () => {
    const {isOpen, onOpen, onClose} = this.props
    if (isOpen) {
      onClose()
    } else {
      onOpen()
    }
  }

  handleInputChange = event => {
    this.props.onInputChange(event.target.value)
  }

  handleKeyDown = event => {
    const {items, highlightIndex, onHighlightIndexChange, isOpen, onOpen, onClose} = this.props
    if (!items || items.length === 0) {
      return
    }

    if (event.key === 'Escape' && isOpen) {
      onClose()
    }

    const lastIndex = items.length - 1
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const nextIndex = highlightIndex - 1
      onHighlightIndexChange(nextIndex < 0 ? lastIndex : nextIndex)
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        onOpen()
      }
      const nextIndex = highlightIndex + 1
      onHighlightIndexChange(nextIndex > lastIndex ? 0 : nextIndex)
    }
  }

  handleKeyUp = event => {
    const {items, onChange, highlightIndex} = this.props
    if (event.key === 'Enter' && highlightIndex > -1) {
      onChange(items[highlightIndex])
    }
  }

  render() {
    const {
      onClear,
      placeholder,
      isLoading,
      value,
      items,
      renderItem,
      isOpen,
      highlightIndex,
      isInputSelected,
      inputValue,
      ...rest
    } = this.props

    return (
      <div>
        <div className={styles.selectContainer}>
          <DefaultTextInput
            {...rest}
            className={styles.select}
            placeholder={placeholder}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
            value={inputValue || ''}
            selected={isInputSelected}
          />
          {
            onClear && inputValue && (
              <button className={styles.clearButton} onClick={onClear}>
                <CloseIcon color="inherit" />
              </button>
            )
          }
          {isLoading && <div className={styles.spinner}><Spinner /></div>}
          {!isLoading && (
            <div className={styles.arrow} onClick={this.handleArrowClick}>
              <FaAngleDown color="inherit" />
            </div>
          )}
        </div>

        <div className={`${isOpen ? styles.listContainer : styles.listContainerHidden}`}>
          {
            items.length === 0 && !isLoading && <p className={styles.noResultText}>No results</p>
          }
          {
            items.length === 0 && isLoading && <Spinner message="Loading items…" center />
          }
          {isOpen && items.length > 0 && (
            <SelectMenu
              items={items}
              value={value}
              onSelect={this.handleSelect}
              renderItem={renderItem}
              highlightIndex={highlightIndex}
            />
          )}
        </div>
      </div>
    )
  }
}

export default enhanceWithClickOutside(StatelessSearchableSelect)
