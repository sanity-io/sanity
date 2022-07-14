import {hues} from '@sanity/color'
import {CheckmarkIcon, SearchIcon} from '@sanity/icons'
import type {ObjectSchemaType} from '@sanity/types'
import {Box, Button, Card, Stack, Text, TextInput} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {getSelectableTypes} from './state/search-selectors'
import {useOmnisearch} from './state/OmnisearchContext'

export function TypeFilter() {
  const [typeFilter, setTypeFilter] = useState('')
  const {
    dispatch,
    state: {
      filtersVisible,
      terms: {types: selectedTypes},
    },
  } = useOmnisearch()

  const allDocumentTypes = useMemo(() => getSelectableTypes(schema, ''), [])
  const displayFilterInput = useMemo(() => allDocumentTypes.length >= 10, [allDocumentTypes])
  const selectableDocumentTypes = useMemo(() => getSelectableTypes(schema, typeFilter), [
    typeFilter,
  ])

  const handleClearTypes = useCallback(() => dispatch({type: 'TYPES_CLEAR'}), [dispatch])
  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  if (!filtersVisible) {
    return null
  }

  return (
    <Container tone="transparent">
      <Card
        paddingX={1}
        paddingTop={1}
        style={{position: 'sticky', top: 0, zIndex: 1}}
        tone="transparent"
      >
        {/* Search */}
        {displayFilterInput && (
          <TextInput
            clearButton={!!typeFilter}
            fontSize={1}
            icon={SearchIcon}
            muted
            onChange={handleFilterChange}
            onClear={handleFilterClear}
            placeholder="Filter document types"
            radius={2}
            value={typeFilter}
          />
        )}
      </Card>
      <Box paddingBottom={1} paddingTop={displayFilterInput ? 1 : 0} paddingX={1}>
        {/* Selectable document types */}
        <Stack space={1}>
          {selectableDocumentTypes.map((type) => (
            <TypeItem key={type.name} selected={selectedTypes.includes(type)} type={type} />
          ))}
        </Stack>

        {/* No results */}
        {!selectableDocumentTypes.length && (
          <Box padding={3}>
            <Text muted size={1} textOverflow="ellipsis">
              No types matches '{typeFilter}'.
            </Text>
          </Box>
        )}
      </Box>
      {/* Clear button (bottom) */}
      {!typeFilter && (
        <Card
          paddingBottom={1}
          paddingX={1}
          style={{position: 'sticky', bottom: 0, zIndex: 1}}
          tone="transparent"
        >
          <Stack space={1}>
            {selectedTypes.length > 0 && (
              <Box style={{borderBottom: `1px solid ${hues.gray[200].hex}`}} />
            )}
            {selectedTypes.length > 0 && (
              <Button
                data-name="type-filter-button"
                disabled={selectedTypes.length === 0}
                fontSize={1}
                mode="bleed"
                onClick={handleClearTypes}
                padding={3}
                text="Clear"
                tone="primary"
              />
            )}
          </Stack>
        </Card>
      )}
    </Container>
  )
}

function TypeItem(props: {selected: boolean; type: ObjectSchemaType}) {
  const {selected, type} = props
  const {dispatch} = useOmnisearch()

  const handleAddType = useCallback(() => {
    dispatch({type: 'TYPE_ADD', schemaType: type})
  }, [dispatch, type])

  const handleRemoveType = useCallback(() => {
    dispatch({type: 'TYPE_REMOVE', schemaType: type})
  }, [dispatch, type])

  return (
    <Button
      fontSize={1}
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

const Container = styled(Card)`
  border-left: 1px solid ${hues.gray[100].hex};
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 250px;
  width: 100%;

  /* TODO: remove this hack, which is currently used to vertically center <TextInput>'s clearButton */
  [data-qa='clear-button'] {
    display: flex;
  }
`
