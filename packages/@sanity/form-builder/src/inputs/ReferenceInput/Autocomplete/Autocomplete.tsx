import React, {useCallback, useEffect, useRef, useState} from 'react'
import styled from 'styled-components'
import {Box, Button, focusFirstDescendant, getResponsiveProp, TextInput} from '@sanity/ui'
import {ListBoxCard, ListBoxContainer, Root} from './styles'

export interface AutocompleteProps<Option extends {_key: string}> {
  border?: boolean
  id: null | string
  onInputChange?: (inputValue: string) => void
  inputValue?: string
  onSelect?: (option: Option) => void
  options: Option[]
  padding?: number | number[]
  radius?: number | number[]
  renderOption?: (option: Option) => React.ReactNode
  size?: number | number[]
}

type OverriddenInputAttrKey =
  | 'aria-activedescendant'
  | 'aria-autocomplete'
  | 'aria-expanded'
  | 'aria-owns'
  | 'as'
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'id'
  | 'onChange'
  | 'ref'
  | 'role'
  | 'spellCheck'
  | 'type'
  | 'value'

type Props<OptionType extends {_key: string}> = AutocompleteProps<OptionType> &
  Omit<React.HTMLProps<HTMLInputElement>, OverriddenInputAttrKey>

const ClearButtonBox = styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;

  & > button {
    vertical-align: top;
  }
`

export function Autocomplete<OptionType extends {_key: string}>(props: Props<OptionType>) {
  const {
    border = true,
    id,
    onInputChange,
    onSelect,
    options: optionsProp,
    padding: paddingProp = 3,
    radius = 2,
    renderOption,
    size = 2,
    inputValue = '',
    ...restProps
  } = props

  const [focused, setFocused] = useState(false)
  const [listHovered, setListHovered] = useState(false)
  const inputId = `${id}-input`
  const listboxId = `${id}-listbox`
  const options = Array.isArray(optionsProp) ? optionsProp : []
  const optionsLen = options.length
  const expanded = focused && optionsLen > 0
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const activeItemId = selectedIndex ? `${id}-option-${selectedIndex}` : undefined
  // const activeValue = (selectedIndex && options[selectedIndex]?.value) || null
  const padding = getResponsiveProp(paddingProp)

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onInputChange) onInputChange(event.currentTarget.value)
    },
    [onInputChange]
  )

  const handleClearButtonClick = useCallback(() => {
    if (onInputChange) onInputChange('')
  }, [onInputChange])

  const handleInputFocus = useCallback(() => {
    setFocused(true)
  }, [])

  const handleInputBlur = useCallback(() => {
    if (!listHovered) setFocused(false)
  }, [listHovered])

  const handleListMouseEnter = useCallback(() => {
    setListHovered(true)
  }, [])

  const handleListMouseLeave = useCallback(() => {
    setListHovered(false)
  }, [])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (!optionsLen) return
        setListHovered(true)
        setSelectedIndex((index) => {
          return (index + 1) % optionsLen
        })

        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!optionsLen) return
        setListHovered(true)
        setSelectedIndex((index) => {
          return index === -1 ? optionsLen - 1 : (optionsLen + index - 1) % optionsLen
        })

        return
      }

      if (event.key === 'Enter') {
        return
      }

      inputRef.current?.focus()
    },
    [optionsLen]
  )

  const handleSelect = useCallback(
    (v: OptionType) => {
      if (onSelect) onSelect(v)
      setFocused(false)
    },
    [onSelect]
  )

  useEffect(() => setSelectedIndex(-1), [optionsLen])

  useEffect(() => {
    const listElement = listRef.current

    if (!listElement) return

    const selectedItemElement = listElement.childNodes[selectedIndex] as HTMLLIElement | undefined

    if (selectedItemElement) {
      focusFirstDescendant(selectedItemElement)
    }
  }, [selectedIndex])

  return (
    <Root onKeyDown={handleInputKeyDown}>
      <TextInput
        {...restProps}
        aria-activedescendant={activeItemId}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-owns={listboxId}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        border={border}
        icon="search"
        id={inputId}
        onBlur={handleInputBlur}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        padding={padding}
        radius={radius}
        ref={inputRef}
        role="combobox"
        size={size}
        spellCheck={false}
        value={inputValue}
      />

      {/* <SearchIconBox margin={padding}>
        <Text size={size}>
          <SearchIcon aria-hidden="true" focusable={false} />
        </Text>
      </SearchIconBox> */}

      {inputValue?.length > 0 && (
        <ClearButtonBox margin={padding.map((v) => v - 1)}>
          <Button
            aria-label="Clear"
            icon="close"
            mode="bleed"
            onClick={handleClearButtonClick}
            padding={padding.map((v) => v - 2)}
            size={size}
          />
        </ClearButtonBox>
      )}

      <ListBoxContainer
        hidden={!expanded}
        onMouseEnter={handleListMouseEnter}
        onMouseLeave={handleListMouseLeave}
      >
        <ListBoxCard paddingY={1} radius={1} shadow={2}>
          <ul aria-multiselectable={false} id={listboxId} ref={listRef} role="listbox">
            {options.map((option, optionIndex) => (
              <AutosuggestOption
                id={`${id}-option-${optionIndex}`}
                key={optionIndex}
                onSelect={handleSelect}
                selected={optionIndex === selectedIndex}
                value={option}
              >
                {renderOption(option)}
              </AutosuggestOption>
            ))}
          </ul>
        </ListBoxCard>
      </ListBoxContainer>
    </Root>
  )
}

function AutosuggestOption<T extends {_key: string}>(props: {
  children: React.ReactNode
  id: string
  onSelect: (v: T) => void
  selected: boolean
  value: T
}) {
  const {children, id, onSelect, selected, value} = props

  const handleClick = useCallback(() => {
    onSelect(value)
  }, [onSelect, value])

  return (
    <li aria-selected={selected} id={id} role="presentation" onClick={handleClick}>
      {children}
    </li>
  )
}
