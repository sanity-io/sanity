import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import CloseIcon from 'part:@sanity/base/close-icon'
import SelectMenu from './SelectMenu'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'

const noop = () => {}

export default class StatelessSearchableSelect extends React.PureComponent {
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
    dropdownPosition: 'bottom'
  }

  handleSelect = item => {
    this.props.onChange(item)
  }
  handlePortalOutsideClick = event => {
    if (!this._rootNode.contains(event.target)) {
      this.props.onClose()
    }
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
    const {items, highlightIndex, onHighlightIndexChange, isOpen, onOpen} = this.props
    if (!items || items.length === 0) {
      return
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

  focus() {
    this._input.focus()
  }

  setListElement = element => {
    this._listElement = element
  }

  setRootNode = node => {
    this._rootNode = node
  }

  setInput = input => {
    this._input = input
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
      disabled,
      onHighlightIndexChange,
      openItemElement,
      ...rest
    } = this.props

    return (
      <div ref={this.setRootNode}>
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
            ref={this.setInput}
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
        <div className={styles.stickyContainer} style={{width: `${this.props.width}px`}}>
          {
            isOpen && (
              <StickyPortal
                isOpen={isOpen}
                onResize={onResize}
                onlyBottomSpace={false}
                useOverlay={false}
                addPadding={false}
                scrollIntoView={false}
              >
                <Stacked>
                  {isActive => (
                    <div
                      className={`
                        ${isOpen ? styles.listContainer : styles.listContainerHidden}
                        ${dropdownPosition === 'top' ? styles.listContainerTop : styles.listContainerBottom}
                        ${items.length === 0 ? styles.listContainerEmpty : ''}
                      `}
                      style={{width: `${this.props.width}px`}}
                      ref={this.setListElement}
                    >
                      {
                        items.length === 0 && !isLoading && <p className={styles.noResultText}>No results</p>
                      }
                      {
                        items.length === 0 && isLoading && <div className={styles.listSpinner}><Spinner message="Loading items…" /></div>
                      }
                      {items.length > 0 && (
                        <CaptureOutsideClicks onClickOutside={isActive ? onClose : null}>
                          <Escapable onEscape={event => ((isActive || event.shiftKey) && onClose())} />
                          <SelectMenu
                            items={items}
                            value={value}
                            onSelect={this.handleSelect}
                            renderItem={renderItem}
                            highlightIndex={highlightIndex}
                          />
                        </CaptureOutsideClicks>
                      )}
                    </div>
                  )}
                </Stacked>
              </StickyPortal>
            )
          }
        </div>
      </div>
    )
  }
}
