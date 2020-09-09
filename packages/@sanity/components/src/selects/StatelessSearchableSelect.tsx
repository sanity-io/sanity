/* eslint-disable complexity, max-depth */

import React from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import CloseIcon from 'part:@sanity/base/close-icon'
import {Manager, Reference, Popper} from 'react-popper'
import {get} from 'lodash'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import {Portal} from '../utilities/Portal'
import SelectMenu from './SelectMenu'

// interface Item {}

type Item = unknown

// @todo
type Value = any

interface StatelessSearchableSelectProps {
  onChange?: (item: Item) => void
  value?: Value
  inputValue?: string
  onInputChange?: (val: string) => void
  onClear?: () => void
  renderItem: (item: Item) => React.ReactNode
  placeholder?: string
  isLoading?: boolean
  isOpen?: boolean
  onOpen?: () => void
  onClose?: (event?: MouseEvent) => void
  openItemElement?: (value: Value) => React.ReactNode
  items?: Item[]
  highlightIndex?: number
  onHighlightIndexChange?: (index: number) => void
  isInputSelected?: boolean
  disabled?: boolean
  dropdownPosition?: string
  readOnly?: boolean
  inputId?: string
}

export default class StatelessSearchableSelect extends React.PureComponent<
  StatelessSearchableSelectProps & React.HTMLProps<HTMLInputElement>
> {
  _input: DefaultTextInput | null = null

  handleSelect = (item: Item) => {
    if (this.props.onChange) this.props.onChange(item)
  }

  handleArrowClick = (event?: React.MouseEvent<HTMLDivElement>) => {
    const {isOpen, onOpen} = this.props
    if (isOpen) {
      this.handleClose()
    } else if (onOpen) onOpen()
  }

  handleArrowKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      this.handleArrowClick()
    }
  }

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.props.onInputChange) this.props.onInputChange(event.target.value)
  }

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const {items, highlightIndex = -1, onHighlightIndexChange, isOpen, onOpen} = this.props

    if (event.key === 'ArrowDown' && !isOpen) {
      if (onOpen) onOpen()
    }

    if (!items || items.length === 0) {
      return
    }

    const lastIndex = items.length - 1
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const nextIndex = highlightIndex - 1
      if (onHighlightIndexChange) {
        onHighlightIndexChange(nextIndex < 0 ? lastIndex : nextIndex)
      }
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        if (onOpen) onOpen()
      }
      const nextIndex = highlightIndex + 1
      if (onHighlightIndexChange) {
        onHighlightIndexChange(nextIndex > lastIndex ? 0 : nextIndex)
      }
    }
  }

  handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const {items = [], onChange, highlightIndex = -1} = this.props
    if (event.key === 'Enter' && highlightIndex > -1 && items[highlightIndex]) {
      if (onChange) onChange(items[highlightIndex])
    }
  }

  handleClose = (event?: MouseEvent) => {
    if (this.props.onClose) this.props.onClose(event)
  }

  setInput = (ref: DefaultTextInput | null) => {
    this._input = ref
  }

  focus() {
    if (this._input) this._input.focus()
  }

  renderItem = (item: Item) => {
    return <div className={styles.item}>{this.props.renderItem(item)}</div>
  }

  render() {
    const {
      onClear,
      placeholder,
      isLoading,
      value,
      items = [],
      renderItem,
      isOpen,
      highlightIndex,
      isInputSelected,
      inputValue,
      onChange,
      onInputChange,
      onOpen,
      onClose,
      dropdownPosition = 'bottom',
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
                ref={this.setInput as any}
                spellCheck="false"
                readOnly={readOnly}
              />
              <div className={styles.functions}>
                {openItemElement && value && (
                  <span className={styles.openItem}>{openItemElement(value)}</span>
                )}
                {!readOnly && onClear && value && (
                  <button type="button" className={styles.clearButton} onClick={onClear}>
                    <CloseIcon color="inherit" />
                  </button>
                )}
                {!readOnly && (
                  <div className={styles.arrowAndSpinnerContainer}>
                    {!isLoading && (
                      <div
                        className={styles.arrow}
                        onClick={disabled ? undefined : this.handleArrowClick}
                        tabIndex={0}
                        onKeyPress={disabled ? undefined : this.handleArrowKeyPress}
                      >
                        <FaAngleDown color="inherit" />
                      </div>
                    )}
                    {isLoading && (
                      <div className={styles.spinner}>
                        <Spinner />
                      </div>
                    )}
                  </div>
                )}
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
                  modifiers={
                    {
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
                    } as any
                  }
                >
                  {({ref, style, placement, arrowProps}) => (
                    <div
                      ref={ref}
                      data-placement={placement}
                      style={style}
                      className={styles.popper}
                    >
                      <CaptureOutsideClicks
                        onClickOutside={isActive && isOpen ? this.handleClose : undefined}
                      >
                        <div
                          className={
                            items.length === 0 ? styles.listContainerNoResult : styles.listContainer
                          }
                        >
                          <Escapable
                            onEscape={event => (isActive || event.shiftKey) && this.handleClose()}
                          />
                          <div
                            className={
                              items.length === 0 && !isLoading
                                ? styles.noResultText
                                : styles.noResultTextHidden
                            }
                          >
                            No results
                          </div>
                          {items.length > 0 && (
                            <SelectMenu
                              items={items}
                              value={value}
                              onSelect={this.handleSelect}
                              renderItem={this.renderItem}
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
