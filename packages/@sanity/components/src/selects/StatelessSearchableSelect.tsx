/* eslint-disable complexity, max-depth */

import React, {useState, useRef} from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import CloseIcon from 'part:@sanity/base/close-icon'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import SelectMenu from './SelectMenu'
import {usePopper} from 'react-popper'

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

const StatelessSearchableSelect = React.forwardRef(
  (props: StatelessSearchableSelectProps & React.HTMLProps<HTMLInputElement>, ref) => {
    const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
    const popper = usePopper(referenceElement, popperElement, {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            altAxis: true,
            boundary: undefined,
            padding: 8
          }
        }
      ]
    })

    const handleSelect = (item: Item) => {
      if (props.onChange) props.onChange(item)
    }

    const handleArrowClick = (event?: React.MouseEvent<HTMLDivElement>) => {
      const {isOpen, onOpen} = props
      if (isOpen) {
        handleClose()
      } else if (onOpen) onOpen()
    }

    const handleArrowKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
        handleArrowClick()
      }
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (props.onInputChange) props.onInputChange(event.target.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const {items, highlightIndex = -1, onHighlightIndexChange, isOpen, onOpen} = props

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

    const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const {items = [], onChange, highlightIndex = -1} = props
      if (event.key === 'Enter' && highlightIndex > -1 && items[highlightIndex]) {
        if (onChange) onChange(items[highlightIndex])
      }
    }

    const handleClose = (event?: MouseEvent) => {
      if (props.onClose) props.onClose(event)
    }

    const renderItem = (item: Item) => {
      return <div className={styles.item}>{props.renderItem(item)}</div>
    }

    const {
      onClear,
      placeholder,
      isLoading,
      value,
      items = [],
      // renderItem,
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
    } = props

    console.log('popper', popper)

    return (
      <div className={styles.root}>
        <div
          ref={setReferenceElement}
          className={disabled ? styles.selectContainerDisabled : styles.selectContainer}
        >
          <DefaultTextInput
            {...rest}
            className={styles.select}
            placeholder={placeholder}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            value={inputValue || ''}
            selected={isInputSelected}
            disabled={disabled}
            ref={ref as any}
            spellCheck="false"
            readOnly={readOnly}
          />
          <div className={styles.functions}>
            {openItemElement && value && (
              <span className={styles.openItem}>{openItemElement(value)}</span>
            )}
            {!readOnly && onClear && value && (
              <button type="button" className={styles.clearButton} onClick={onClear}>
                <CloseIcon />
              </button>
            )}
            {!readOnly && (
              <div className={styles.arrowAndSpinnerContainer}>
                {!isLoading && (
                  <div
                    className={styles.arrow}
                    onClick={disabled ? undefined : handleArrowClick}
                    tabIndex={0}
                    onKeyPress={disabled ? undefined : handleArrowKeyPress}
                  >
                    <FaAngleDown />
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
        {isOpen && (
          <div
            ref={setPopperElement}
            className={styles.popper}
            style={popper.styles.popper}
            {...popper.attributes.popper}
          >
            <CaptureOutsideClicks
              onClickOutside={/* isActive && */ isOpen ? handleClose : undefined}
            >
              <div
                className={items.length === 0 ? styles.listContainerNoResult : styles.listContainer}
              >
                <Escapable onEscape={event => /* isActive ||  */ event.shiftKey && handleClose()} />
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
                    onSelect={handleSelect}
                    renderItem={renderItem}
                    highlightIndex={highlightIndex}
                  />
                )}
              </div>
            </CaptureOutsideClicks>
          </div>
        )}
      </div>
    )
  }
)

StatelessSearchableSelect.displayName = 'StatelessSearchableSelect'
export default StatelessSearchableSelect
