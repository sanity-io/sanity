import {SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../hooks'
import {SUBHEADER_HEIGHT_LARGE, SUBHEADER_HEIGHT_SMALL} from '../constants'
import {CommandListProvider} from '../contexts/commandList'
import {useSearchState} from '../contexts/search'
import {getSelectableOmnisearchTypes} from '../utils/selectors'
import {supportsTouch} from '../utils/supportsTouch'
import {CustomTextInput} from './CustomTextInput'
import {PointerOverlay} from './PointerOverlay'
import {TypeFilterItem} from './TypeFilterItem'

interface TypeFiltersProps {
  small?: boolean
}

const ClearButtonBox = styled(Box)`
  border-top: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const SearchHeaderBox = styled(Box)`
  border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const SearchHeaderContentFlex = styled(Flex)<{$small?: boolean}>`
  box-sizing: border-box;
  height: ${({$small}) => ($small ? SUBHEADER_HEIGHT_SMALL : SUBHEADER_HEIGHT_LARGE)}px;
`

const TypeFiltersContentBox = styled(Box)`
  outline: none;
  overflow-x: hidden;
  overflow-y: scroll;
`

const TypeFiltersContentDiv = styled.div`
  position: relative;
`

const TypeFiltersFlex = styled(Flex)<{$lightHighlight: boolean}>`
  height: 100%;
`

export function TypeFilters({small}: TypeFiltersProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [filtersContentElement, setFiltersContentRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)
  const [typeFilter, setTypeFilter] = useState('')

  const schema = useSchema()

  const {
    dispatch,
    state: {
      terms: {types: selectedTypes},
    },
  } = useSearchState()

  const selectableDocumentTypes = useMemo(
    () => getSelectableOmnisearchTypes(schema, typeFilter),
    [schema, typeFilter]
  )

  const handleClearTypes = useCallback(() => {
    if (!supportsTouch) {
      headerInputElement?.focus()
    }
    filtersContentElement?.scrollTo(0, 0)
    dispatch({type: 'TERMS_TYPES_CLEAR'})
  }, [dispatch, filtersContentElement, headerInputElement])
  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const padding = small ? 1 : 2

  const commandListId = useId()

  return (
    <CommandListProvider
      ariaChildrenLabel="Document types"
      ariaHeaderLabel="Filter by document type"
      ariaMultiselectable
      childContainerElement={childContainerElement}
      childCount={selectableDocumentTypes.length}
      containerElement={containerElement}
      headerInputElement={headerInputElement}
      id={commandListId}
      level={1}
      pointerOverlayElement={pointerOverlayElement}
    >
      <TypeFiltersFlex $lightHighlight={!small} direction="column" ref={setContainerRef}>
        {/* Search header */}
        <SearchHeaderBox>
          <SearchHeaderContentFlex $small={small} align="center" flex={1} padding={padding}>
            <CustomTextInput
              autoComplete="off"
              // border={false} // TODO: re-enable when flashing border issue is fixed
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
          </SearchHeaderContentFlex>
        </SearchHeaderBox>

        <TypeFiltersContentBox
          data-overflow
          flex={1}
          padding={padding}
          ref={setFiltersContentRef}
          tabIndex={-1}
        >
          <TypeFiltersContentDiv>
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
          </TypeFiltersContentDiv>

          {/* No results */}
          {!selectableDocumentTypes.length && (
            <Box padding={3}>
              <Text muted size={small ? 1 : 2} textOverflow="ellipsis">
                No matches for '{typeFilter}'.
              </Text>
            </Box>
          )}
        </TypeFiltersContentBox>

        {/* Clear button */}
        {!typeFilter && selectedTypes.length > 0 && (
          <ClearButtonBox padding={padding}>
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
          </ClearButtonBox>
        )}
      </TypeFiltersFlex>
    </CommandListProvider>
  )
}
