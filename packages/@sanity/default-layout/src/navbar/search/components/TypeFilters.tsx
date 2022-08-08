import {hues} from '@sanity/color'
import {CheckmarkIcon, SearchIcon} from '@sanity/icons'
import type {ObjectSchemaType} from '@sanity/types'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {getSelectableTypes} from '../contexts/search/selectors'
import {useContainerArrowNavigation} from '../hooks/useContainerArrowNavigation'
import {withCommandPaletteItemStyles} from '../utils/withCommandPaletteItemStyles'
import {CustomTextInput} from './CustomTextInput'

const CommandPaletteButton = withCommandPaletteItemStyles(Button)

interface TypeFiltersProps {
  small?: boolean
}

export function TypeFilters({small}: TypeFiltersProps) {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [typeFilter, setTypeFilter] = useState('')
  const {
    dispatch,
    state: {
      terms: {types: selectedTypes},
    },
  } = useSearchState()

  const selectableDocumentTypes = useMemo(() => getSelectableTypes(schema, typeFilter), [
    typeFilter,
  ])

  const handleClearTypes = useCallback(() => {
    inputRef?.current?.focus()
    dispatch({type: 'TERMS_TYPES_CLEAR'})
  }, [dispatch])
  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  useContainerArrowNavigation({childContainerRef, containerRef: headerContainerRef, inputRef}, [
    typeFilter,
  ])

  const padding = small ? 1 : 2

  return (
    <TypeFiltersWrapper direction="column">
      {/* Search header */}
      <SearchHeaderWrapper padding={padding} ref={headerContainerRef}>
        <CustomTextInput
          border={false}
          clearButton={!!typeFilter}
          fontSize={small ? 1 : 2}
          icon={SearchIcon}
          muted
          onChange={handleFilterChange}
          onClear={handleFilterClear}
          placeholder="Document type"
          ref={inputRef}
          smallClearButton
          radius={2}
          value={typeFilter}
        />
      </SearchHeaderWrapper>

      <TypeFiltersContent flex={1} padding={padding}>
        {/* Selectable document types */}
        <Stack ref={childContainerRef} space={1}>
          {selectableDocumentTypes.map((type) => (
            <TypeItem
              key={type.name}
              selected={selectedTypes.includes(type)}
              small={small}
              type={type}
            />
          ))}
        </Stack>

        {/* No results */}
        {!selectableDocumentTypes.length && (
          <Box padding={3}>
            <Text muted size={small ? 1 : 2} textOverflow="ellipsis">
              No matches for '{typeFilter}'.
            </Text>
          </Box>
        )}
      </TypeFiltersContent>

      {/* Clear button */}
      {!typeFilter && selectedTypes.length > 0 && (
        <ClearButtonWrapper padding={padding}>
          <Stack>
            <Button
              data-name="type-filter-button"
              disabled={selectedTypes.length === 0}
              fontSize={small ? 1 : 2}
              mode="bleed"
              onClick={handleClearTypes}
              padding={3}
              text="Clear"
              tone="primary"
            />
          </Stack>
        </ClearButtonWrapper>
      )}
    </TypeFiltersWrapper>
  )
}

function TypeItem({
  selected,
  small,
  type,
}: {
  selected: boolean
  small?: boolean
  type: ObjectSchemaType
}) {
  const {dispatch} = useSearchState()

  const handleAddType = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: type})
  }, [dispatch, type])

  const handleRemoveType = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: type})
  }, [dispatch, type])

  return (
    <CommandPaletteButton
      fontSize={small ? 1 : 2}
      iconRight={selected && CheckmarkIcon}
      justify="flex-start"
      key={type.title ?? type.name}
      mode="bleed"
      onClick={selected ? handleRemoveType : handleAddType}
      selected={selected}
      text={type.title ?? type.name}
      tone={selected ? 'primary' : 'default'}
    />
  )
}

const ClearButtonWrapper = styled(Box)`
  border-top: 1px solid ${hues.gray[200].hex};
`

const SearchHeaderWrapper = styled(Box)`
  border-bottom: 1px solid ${hues.gray[200].hex};
`

const TypeFiltersContent = styled(Box)`
  overflow-x: hidden;
  overflow-y: scroll;
`

const TypeFiltersWrapper = styled(Flex)`
  height: 100%;
`
