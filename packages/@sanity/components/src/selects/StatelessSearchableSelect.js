import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import CloseIcon from 'part:@sanity/base/close-icon'
import enhanceWithClickOutside from 'react-click-outside'
import SelectMenu from './SelectMenu'
import StickyPortal from 'part:@sanity/components/portal/sticky'

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
    onResize: PropTypes.func,
    openItemElement: PropTypes.func,
    items: PropTypes.array,
    highlightIndex: PropTypes.number,
    onHighlightIndexChange: PropTypes.func,
    isInputSelected: PropTypes.bool,
    scrollContainer: PropTypes.object,
    width: PropTypes.number,
    disabled: PropTypes.bool,
    dropdownPosition: PropTypes.string
  }

  static defaultProps = {
    onChange: noop,
    onOpen: noop,
    onClose: noop,
    onInputChange: noop,
    isLoading: false,
    renderItem: item => item,
    items: [],
    width: 100,
    scrollContainer: undefined,
    dropdownPosition: 'bottom'
  }

  handleClickOutside = event => {
    if (this.props.isOpen && !this._listElement.contains(event.target)) {
      this.props.onClose()
    }
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
    if (event.key === 'Enter' && highlightIndex > -1 && items[highlightIndex]) {
      onChange(items[highlightIndex])
    }
  }

  setListElement = element => {
    this._listElement = element
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
      onChange,
      onInputChange,
      onOpen,
      onClose,
      onResize,
      dropdownPosition,
      scrollContainer,
      disabled,
      onHighlightIndexChange,
      openItemElement,
      ...rest
    } = this.props

    return (
      <div>
        <div className={disabled ? styles.selectContainerDisabled : styles.selectContainer}>
          <DefaultTextInput
            {...rest}
            className={styles.select}
            placeholder={placeholder}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
            value={inputValue || ''}
            selected={isInputSelected}
            disabled={disabled}
          />
          {
            onClear && inputValue && (
              <button className={styles.clearButton} onClick={onClear}>
                <CloseIcon color="inherit" />
              </button>
            )
          }
          {isLoading && <div className={styles.spinner}><Spinner /></div>}
          {
            openItemElement && value && (
              <span className={styles.openItem}>{openItemElement(value)}</span>
            )
          }
          {!isLoading && (
            <div className={styles.arrow} onClick={disabled ? null : this.handleArrowClick}>
              <FaAngleDown color="inherit" />
            </div>
          )}
        </div>
        <StickyPortal
          isOpen={isOpen}
          scrollContainer={scrollContainer}
          onResize={onResize}
          onlyBottomSpace={false}
          useOverlay={false}
          addPadding={false}
          scrollIntoView={false}
        >
          <div
            className={`
              ${isOpen ? styles.listContainer : styles.listContainerHidden}
              ${dropdownPosition == 'top' ? styles.listContainerTop : styles.listContainerBottom}
            `}
            style={{width: `${this.props.width}px`}}
            ref={this.setListElement}
          >
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
        </StickyPortal>
      </div>
    )
  }
}

export default enhanceWithClickOutside(StatelessSearchableSelect)
