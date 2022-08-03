import {hues} from '@sanity/color'
import {CheckmarkIcon, SearchIcon} from '@sanity/icons'
import type {ObjectSchemaType} from '@sanity/types'
import {Box, Button, Card, Flex, Stack, Text, Theme} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {useSearchState} from '../contexts/search'
import {getSelectableTypes} from '../contexts/search/selectors'
import {useContainerArrowNavigation} from '../hooks/useContainerArrowNavigation'
import {CustomTextInput} from './CustomTextInput'

interface TypeFiltersProps {
  small?: boolean
}

export function TypeFilters({small}: TypeFiltersProps) {
  const childContainerRef = useRef<HTMLDivElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [typeFilter, setTypeFilter] = useState('')
  const {
    state: {
      terms: {types: selectedTypes},
    },
  } = useSearchState()

  const allDocumentTypes = useMemo(() => getSelectableTypes(schema, ''), [])
  const displayFilterInput = useMemo(() => allDocumentTypes.length >= 10, [allDocumentTypes])
  const selectableDocumentTypes = useMemo(() => getSelectableTypes(schema, typeFilter), [
    typeFilter,
  ])

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
      {displayFilterInput && (
        <Card padding={padding} ref={headerContainerRef} tone="inherit">
          <CustomTextInput
            backgroundTone={small ? 'darker' : 'dark'}
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
        </Card>
      )}

      <TypeFiltersContent
        flex={1}
        paddingBottom={padding}
        paddingTop={displayFilterInput ? 0 : padding}
        paddingX={padding}
        tone="inherit"
      >
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
    <TypeItemButton
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

const TypeItemButton = styled(Button)(({theme}: {theme: Theme}) => {
  const {color} = theme.sanity
  // TODO: use idiomatic sanity/ui styling, double check usage of `bg2`
  return css`
    &[aria-selected='true'] {
      background: ${color.button.bleed.default.hovered.bg2};
      // Disable box-shadow to hide the the halo effect when we have keyboard focus over a selected <Button>
      // TODO: see if there's a better way to address this
      box-shadow: none;
    }
  `
})

const TypeFiltersContent = styled(Card)`
  overflow-x: hidden;
  overflow-y: scroll;
`

const TypeFiltersWrapper = styled(Flex)`
  height: 100%;
`
