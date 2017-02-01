import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import {uniqueId} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import DefaultList from 'part:@sanity/components/lists/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import CloseIcon from 'part:@sanity/base/close-icon'
import enhanceWithClickOutside from 'react-click-outside'

const noop = () => {}

class StatelessSearchableSelect extends React.PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.any,
    focus: PropTypes.bool,

    inputValue: PropTypes.string,
    onInputChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,

    onClear: PropTypes.func,
    renderItem: PropTypes.func,
    placeholder: PropTypes.string,

    hasError: PropTypes.bool,
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
    onInputChange: noop,
    hasError: false,
    focus: false,
    isLoading: false,
    renderItem: item => item,
    items: []
  }

  handleClickOutside = () => {
    this.props.onClose()
  }

  handleInputFocus = event => {
    this.props.onFocus(event)
  }

  handleInputBlur = event => {
    this.props.onBlur(event)
  }

  handleSelect = item => {
    this.props.onChange(item)
  }

  handleArrowClick = () => {
    const {isOpen, onOpen, onClose, onFocus} = this.props
    if (isOpen) {
      onClose()
    } else {
      onFocus()
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

    if (event.key == 'Escape' && isOpen) {
      onClose()
    }

    if (event.key == 'ArrowUp' && highlightIndex > -1) {
      event.preventDefault()
      onHighlightIndexChange(Math.max(highlightIndex - 1, -1))
    }
    if (event.key == 'ArrowDown' && highlightIndex < items.length - 1) {
      event.preventDefault()

      if (isOpen) {
        onHighlightIndexChange(Math.min(highlightIndex + 1, items.length - 1))
      } else {
        onOpen()
      }
    }
  }

  handleKeyUp = event => {
    const {items, onChange, highlightIndex} = this.props
    if (event.key == 'Enter' && highlightIndex > -1) {
      onChange(items[highlightIndex])
    }
  }

  componentWillMount() {
    this._inputId = uniqueId('SearchableSelect')
  }

  render() {
    const {
      label,
      onClear,
      placeholder,
      isLoading,
      value,
      description,
      items,
      renderItem,
      focus,
      isOpen,
      highlightIndex,
      isInputSelected,
      inputValue
    } = this.props

    return (
      <DefaultFormField
        className={styles.root}
        description={description}
        labelHtmlFor={this._inputId}
        label={label}
      >
        <div className={styles.selectContainer}>
          <DefaultTextInput
            className={styles.select}
            id={this._inputId}
            placeholder={placeholder}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
            onFocus={this.handleInputFocus}
            onBlur={this.handleInputBlur}
            value={inputValue || ''}
            selected={isInputSelected}
            focus={focus}
          />
          {
            onClear && (
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
            items.length == 0 && !isLoading && <p className={styles.noResultText}>No results</p>
          }
          {
            items.length == 0 && isLoading && <Spinner message="Loading items…" center />
          }
          <DefaultList
            items={items}
            highlightedItem={(items && items[highlightIndex]) || value}
            selectedItem={value}
            scrollable
            onSelect={this.handleSelect}
            renderItem={renderItem}
          />
        </div>

      </DefaultFormField>
    )
  }
}

export default enhanceWithClickOutside(StatelessSearchableSelect)
