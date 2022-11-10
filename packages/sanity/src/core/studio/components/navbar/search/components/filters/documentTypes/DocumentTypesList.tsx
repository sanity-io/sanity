import {SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Label, MenuDivider, Stack, Text} from '@sanity/ui'
import partition from 'lodash/partition'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../../../hooks'
import {SUBHEADER_HEIGHT_SMALL} from '../../../constants'
import {CommandListProvider} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getSelectableOmnisearchTypes} from '../../../utils/selectors'
import {supportsTouch} from '../../../utils/supportsTouch'
import {CustomTextInput} from '../../common/CustomTextInput'
import {PointerOverlay} from '../common/PointerOverlay'
import {TypeFilterItem} from './TypeFilterItem'

const ClearButtonBox = styled(Box)`
  border-top: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const SearchHeaderBox = styled(Box)`
  border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const SearchHeaderContentFlex = styled(Flex)`
  box-sizing: border-box;
  height: ${SUBHEADER_HEIGHT_SMALL};
`

const TypeFiltersContentBox = styled(Box)`
  outline: none;
  overflow-x: hidden;
  overflow-y: scroll;
`

const TypeFiltersContentDiv = styled.div`
  position: relative;
`

// TODO: Convert to virtual list
export function DocumentTypesList() {
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

  // Get a snapshot of initial selected types
  const [selectedTypesSnapshot, setSelectedTypesSnapshot] = useState(selectedTypes)

  const {filteredSelected, filteredUnselected} = useMemo(() => {
    const partitionedTypes = partition(getSelectableOmnisearchTypes(schema, typeFilter), (type) =>
      selectedTypesSnapshot.includes(type)
    )
    return {
      filteredSelected: partitionedTypes[0],
      filteredUnselected: partitionedTypes[1],
    }
  }, [schema, selectedTypesSnapshot, typeFilter])

  const handleClearTypes = useCallback(() => {
    if (!supportsTouch) {
      headerInputElement?.focus()
    }
    setSelectedTypesSnapshot([])
    filtersContentElement?.scrollTo(0, 0)
    dispatch({type: 'TERMS_TYPES_CLEAR'})
  }, [dispatch, filtersContentElement, headerInputElement])

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const commandListId = useId()

  const documentTypeCount = filteredSelected.length + filteredUnselected.length

  return (
    <CommandListProvider
      ariaChildrenLabel="Document types"
      ariaHeaderLabel="Filter by document type"
      ariaMultiselectable
      childContainerElement={childContainerElement}
      childCount={documentTypeCount}
      containerElement={containerElement}
      headerInputElement={headerInputElement}
      id={commandListId}
      level={1}
      pointerOverlayElement={pointerOverlayElement}
    >
      <Flex direction="column" ref={setContainerRef}>
        {/* Search header */}
        <SearchHeaderBox>
          <SearchHeaderContentFlex align="center" flex={1} padding={1}>
            <CustomTextInput
              autoComplete="off"
              border={false}
              clearButton={!!typeFilter}
              fontSize={1}
              icon={SearchIcon}
              muted
              onChange={handleFilterChange}
              onClear={handleFilterClear}
              placeholder="Filter"
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
          padding={1}
          ref={setFiltersContentRef}
          tabIndex={-1}
        >
          <TypeFiltersContentDiv>
            <PointerOverlay ref={setPointerOverlayRef} />

            {/* Selectable document types */}
            <Stack ref={setChildContainerRef} space={1}>
              {/* Selected */}
              {filteredSelected.length > 0 && (
                <>
                  <Box padding={3}>
                    <Label muted size={0}>
                      Selected
                    </Label>
                  </Box>
                  {filteredSelected.map((type, index) => (
                    <TypeFilterItem
                      index={index}
                      key={type.name}
                      selected={selectedTypes.includes(type)}
                      type={type}
                    />
                  ))}
                </>
              )}
              {/* Divider */}
              {filteredSelected.length > 0 && filteredUnselected.length > 0 && <MenuDivider />}
              {/* Unselected */}
              {filteredUnselected.map((type, index) => (
                <TypeFilterItem
                  index={index}
                  key={type.name}
                  selected={selectedTypes.includes(type)}
                  type={type}
                />
              ))}
            </Stack>
          </TypeFiltersContentDiv>

          {/* No results */}
          {!documentTypeCount && (
            <Box padding={3}>
              <Text muted size={1} textOverflow="ellipsis">
                No matches for '{typeFilter}'
              </Text>
            </Box>
          )}
        </TypeFiltersContentBox>

        {/* Clear button */}
        {!typeFilter && selectedTypes.length > 0 && (
          <ClearButtonBox padding={1}>
            <Stack>
              <Button
                aria-label="Clear checked filters"
                data-name="type-filter-button"
                disabled={selectedTypes.length === 0}
                fontSize={1}
                mode="bleed"
                onClick={handleClearTypes}
                padding={3}
                text="Clear"
                tone="primary"
              />
            </Stack>
          </ClearButtonBox>
        )}
      </Flex>
    </CommandListProvider>
  )
}
