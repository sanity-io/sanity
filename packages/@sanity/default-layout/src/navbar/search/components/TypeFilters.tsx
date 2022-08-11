// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {hues} from '@sanity/color'
import {SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {CommandListProvider} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {getSelectableTypes} from '../contexts/search/selectors'
import {CustomTextInput} from './CustomTextInput'
import {PointerOverlay} from './PointerOverlay'
import {TypeFilterItem} from './TypeFilterItem'

interface TypeFiltersProps {
  small?: boolean
}

export function TypeFilters({small}: TypeFiltersProps) {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const childContainerParentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pointerOverlayRef = useRef<HTMLDivElement>(null)

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

  const padding = small ? 1 : 2

  return (
    <CommandListProvider
      childContainerRef={childContainerRef}
      childContainerParentRef={childContainerParentRef}
      childCount={selectableDocumentTypes.length}
      headerInputRef={inputRef}
      pointerOverlayRef={pointerOverlayRef}
    >
      <TypeFiltersWrapper direction="column">
        {/* Search header */}
        <SearchHeaderWrapper padding={padding}>
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
          <div ref={childContainerParentRef} style={{position: 'relative'}}>
            <PointerOverlay ref={pointerOverlayRef} />

            {/* Selectable document types */}
            <Stack ref={childContainerRef} space={1}>
              {selectableDocumentTypes.map((type, index) => (
                <TypeFilterItem
                  index={index}
                  key={type.name}
                  selected={selectedTypes.includes(type)}
                  small={small}
                  type={type}
                />
              ))}
            </Stack>
          </div>

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
    </CommandListProvider>
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
