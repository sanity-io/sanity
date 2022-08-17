// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {hues} from '@sanity/color'
import {SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo, useState} from 'react'
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

const ID = 'search-type-filters'

export function TypeFilters({small}: TypeFiltersProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)
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
    headerInputElement?.focus()
    dispatch({type: 'TERMS_TYPES_CLEAR'})
  }, [dispatch, headerInputElement])
  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const padding = small ? 1 : 2

  return (
    <CommandListProvider
      ariaChildrenLabel="Document types"
      ariaHeaderLabel="Filter by document type"
      ariaMultiselectable
      childContainerElement={childContainerElement}
      childCount={selectableDocumentTypes.length}
      containerElement={containerElement}
      headerInputElement={headerInputElement}
      id={ID}
      pointerOverlayElement={pointerOverlayElement}
    >
      <TypeFiltersWrapper $lightHighlight={!small} direction="column" ref={setContainerRef}>
        {/* Search header */}
        <SearchHeaderWrapper padding={padding}>
          <CustomTextInput
            autoComplete="off"
            border={false}
            clearButton={!!typeFilter}
            fontSize={small ? 1 : 2}
            icon={SearchIcon}
            muted
            onChange={handleFilterChange}
            onClear={handleFilterClear}
            placeholder="Document type"
            ref={setHeaderInputRef}
            smallClearButton
            spellCheck={false}
            radius={2}
            value={typeFilter}
          />
        </SearchHeaderWrapper>

        <TypeFiltersContent flex={1} padding={padding}>
          <TypeFiltersContentWrap>
            <PointerOverlay ref={setPointerOverlayRef} />

            {/* Selectable document types */}
            <Stack ref={setChildContainerRef} space={1}>
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
          </TypeFiltersContentWrap>

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
                aria-label="Clear checked filters"
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

const TypeFiltersContentWrap = styled.div`
  position: relative;
`

const TypeFiltersWrapper = styled(Flex)<{$lightHighlight: boolean}>`
  height: 100%;

  &[data-focused='true'],
  &[data-hovered='true'] {
    #${ID}-children {
      [aria-selected='true'] {
        background: ${({$lightHighlight}) =>
          $lightHighlight ? hues.gray[50].hex : hues.gray[100].hex};
        // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
        box-shadow: none;
      }
    }
  }
`
