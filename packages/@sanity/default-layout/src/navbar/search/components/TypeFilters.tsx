import {useRovingFocus} from '@sanity/base/components'
import {hues} from '@sanity/color'
import {CheckmarkIcon, SearchIcon} from '@sanity/icons'
import type {ObjectSchemaType} from '@sanity/types'
import {Box, Button, Card, Stack, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {useSearchState} from '../contexts/search'
import {getSelectableTypes} from '../contexts/search/selectors'
import {CustomTextInput} from './CustomTextInput'

interface TypeFiltersProps {
  small?: boolean
}

export function TypeFilters({small}: TypeFiltersProps) {
  const [typeFilter, setTypeFilter] = useState('')
  const [focusRootElement, setFocusRootElement] = useState<HTMLDivElement | null>(null)
  const {
    dispatch,
    state: {
      terms: {types: selectedTypes},
    },
  } = useSearchState()

  const allDocumentTypes = useMemo(() => getSelectableTypes(schema, ''), [])
  const displayFilterInput = useMemo(() => allDocumentTypes.length >= 10, [allDocumentTypes])
  const selectableDocumentTypes = useMemo(() => getSelectableTypes(schema, typeFilter), [
    typeFilter,
  ])

  const handleClearTypes = useCallback(() => dispatch({type: 'TERMS_TYPES_CLEAR'}), [dispatch])
  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])
  const contentTopPadding = small ? 1 : 2

  // Enable keyboard arrow navigation
  useRovingFocus({
    direction: 'vertical',
    initialFocus: 'first',
    loop: true,
    rootElement: focusRootElement,
  })

  return (
    <>
      {/* Search header */}
      <StickyCard $anchor="top" paddingX={small ? 1 : 2} paddingTop={small ? 1 : 2} tone="inherit">
        {displayFilterInput && (
          <CustomTextInput
            clearButton={!!typeFilter}
            fontSize={small ? 1 : 2}
            icon={SearchIcon}
            muted
            onChange={handleFilterChange}
            onClear={handleFilterClear}
            placeholder="Document type"
            smallClearButton={!small}
            radius={2}
            value={typeFilter}
          />
        )}
      </StickyCard>

      <Card
        paddingBottom={small ? 1 : 2}
        paddingTop={displayFilterInput ? contentTopPadding : 0}
        paddingX={small ? 1 : 2}
        ref={setFocusRootElement}
        tone="inherit"
      >
        {/* Selectable document types */}
        <Stack space={1}>
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
      </Card>

      {/* Clear button */}
      {!typeFilter && selectedTypes.length > 0 && (
        <StickyCard
          $anchor="bottom"
          paddingBottom={small ? 1 : 2}
          paddingX={small ? 1 : 2}
          tone="inherit"
        >
          <Stack space={small ? 1 : 2}>
            <Box style={{borderBottom: `1px solid ${hues.gray[200].hex}`}} />
            <Button
              data-name="type-filter-button"
              disabled={selectedTypes.length === 0}
              fontSize={small ? 1 : 2}
              mode="bleed"
              onClick={handleClearTypes}
              // padding={small ? 3 : 4}
              padding={3}
              text="Clear"
              tone="primary"
            />
          </Stack>
        </StickyCard>
      )}
    </>
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
    <Button
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

const StickyCard = styled(Card)<{$anchor: 'bottom' | 'top'}>(({$anchor}) => {
  return css`
    position: sticky;
    z-index: 1;

    ${$anchor === 'bottom' &&
    css`
      bottom: 0;
    `}

    ${$anchor === 'top' &&
    css`
      top: 0;
    `}
  `
})
