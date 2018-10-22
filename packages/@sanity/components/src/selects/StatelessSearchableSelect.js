/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import CloseIcon from 'part:@sanity/base/close-icon'
import SelectMenu from './SelectMenu'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import {Portal} from '../utilities/Portal'
import {Manager, Reference, Popper} from 'react-popper'
import {get} from 'lodash'

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
    openItemElement: PropTypes.func,
    items: PropTypes.array,
    highlightIndex: PropTypes.number,
    onHighlightIndexChange: PropTypes.func,
    isInputSelected: PropTypes.bool,
    disabled: PropTypes.bool,
    dropdownPosition: PropTypes.string,
    readOnly: PropTypes.bool
  }

  static defaultProps = {
    onChange: noop,
    onOpen: noop,
    onClose: noop,
    onInputChange: noop,
    isLoading: false,
    readOnly: false,
    renderItem: item => item,
    items: [],
    dropdownPosition: 'bottom'
  }

  handleSelect = item => {
    this.props.onChange(item)
  }

  handleArrowClick = () => {
    const {isOpen, onOpen} = this.props
    if (isOpen) {
      this.handleClose()
    } else {
      onOpen()
    }
  }

  handleArrowKeyPress = event => {
    if (event.key === 'Enter') {
      this.handleArrowClick()
    }
  }

  handleInputChange = event => {
    this.props.onInputChange(event.target.value)
  }

  handleKeyDown = event => {
    const {items, highlightIndex, onHighlightIndexChange, isOpen, onOpen} = this.props

    if (event.key === 'ArrowDown' && !isOpen) {
      onOpen()
    }

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

  handleClose = event => {
    this.props.onClose()
  }

  setInput = input => {
    this._input = input
  }

  focus() {
    this._input.focus()
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
      dropdownPosition,
      disabled,
      onHighlightIndexChange,
      openItemElement,
      readOnly,
      ...rest
    } = this.props

    return (
      <Manager>
        <Reference>
          {({ref}) => (
            <div
              ref={ref}
              className={disabled ? styles.selectContainerDisabled : styles.selectContainer}
            >
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
                spellcheck="false"
              />
              <div className={styles.functions}>
                {openItemElement &&
                  value && <span className={styles.openItem}>{openItemElement(value)}</span>}
                {onClear &&
                  value && (
                    <button type="button" className={styles.clearButton} onClick={onClear}>
                      <CloseIcon color="inherit" />
                    </button>
                  )}
                {!isLoading && (
                  <div
                    className={styles.arrow}
                    onClick={disabled ? null : this.handleArrowClick}
                    tabIndex={0}
                    onKeyPress={disabled ? null : this.handleArrowKeyPress}
                  >
                    <FaAngleDown color="inherit" />
                  </div>
                )}
                {isLoading && <Spinner />}
              </div>
            </div>
          )}
        </Reference>
        {isOpen && (
          <Stacked>
            {isActive => (
              <Portal>
                <Popper
                  placement="bottom"
                  modifiers={{
                    preventOverflow: {
                      boundariesElement: 'viewport'
                    },
                    customStyle: {
                      enabled: true,
                      fn: data => {
                        const width = get(data, 'instance.reference.clientWidth') || 500
                        data.styles = {
                          ...data.styles,
                          width: width
                        }
                        return data
                      }
                    }
                  }}
                >
                  {({ref, style, placement, arrowProps}) => (
                    <div ref={ref} data-placement={placement} style={style} className={styles.popper}>
                      <CaptureOutsideClicks
                        onClickOutside={isActive && isOpen ? this.handleClose : undefined}
                      >
                        <div className={styles.listContainer}>
                          <Escapable
                            onEscape={event => (isActive || event.shiftKey) && this.handleClose()}
                          />
                          {items.length === 0 &&
                            !isLoading && <p className={styles.noResultText}>No results</p>}
                          {items.length === 0 &&
                            isLoading && (
                              <div className={styles.listSpinner}>
                                <Spinner message="Loading items…" />
                              </div>
                            )}
                          {items.length > 0 && (
                            <SelectMenu
                              items={items}
                              value={value}
                              onSelect={this.handleSelect}
                              renderItem={renderItem}
                              highlightIndex={highlightIndex}
                            />
                          )}
                        </div>
                      </CaptureOutsideClicks>
                    </div>
                  )}
                </Popper>
              </Portal>
            )}
          </Stacked>
        )}
      </Manager>
    )
  }
}
