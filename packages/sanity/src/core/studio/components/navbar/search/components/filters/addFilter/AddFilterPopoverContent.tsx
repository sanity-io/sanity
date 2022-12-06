import {Box, Flex, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {useSchema} from '../../../../../../../hooks'
import {CommandListProvider} from '../../commandList/CommandListProvider'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {CommandListContainer} from '../../commandList/CommandListContainer'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {AddFilterVirtualList} from './AddFilterVirtualList'
import {createFilterMenuItems} from './createFilterMenuItems'

interface AddFilterPopoverContentProps {
  onClose: () => void
}

export function AddFilterPopoverContent({onClose}: AddFilterPopoverContentProps) {
  const [titleFilter, setTitleFilter] = useState('')

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTitleFilter(e.currentTarget.value),
    [setTitleFilter]
  )
  const handleFilterClear = useCallback(() => setTitleFilter(''), [])

  const schema = useSchema()

  const {
    state: {
      documentTypesNarrowed,
      definitions,
      terms: {types},
    },
  } = useSearchState()

  const filteredMenuItems = useMemo(
    () =>
      createFilterMenuItems({
        documentTypesNarrowed,
        fieldDefinitions: definitions.fields,
        filterDefinitions: definitions.filters,
        schema,
        titleFilter,
        types,
      }),
    [documentTypesNarrowed, definitions.fields, definitions.filters, schema, titleFilter, types]
  )

  /**
   * Create a map of indices for our virtual list, ignoring non-filter items.
   * This is to ensure navigating via keyboard skips over these non-interactive items.
   */
  const itemIndices = useMemo(() => {
    let i = -1
    return filteredMenuItems.reduce<(number | null)[]>((acc, val, index) => {
      const isInteractive = val.type === 'filter'
      if (isInteractive) {
        i += 1
      }
      acc[index] = isInteractive ? i : null
      return acc
    }, [])
  }, [filteredMenuItems])

  return (
    <CommandListProvider
      ariaActiveDescendant={filteredMenuItems.length > 0}
      ariaChildrenLabel="Filters"
      ariaHeaderLabel="Filter by title"
      autoFocus
      itemIndices={itemIndices}
    >
      <Flex direction="column" style={{width: '300px'}}>
        {/* Filter header */}
        <FilterPopoverContentHeader
          onChange={handleFilterChange}
          onClear={handleFilterClear}
          typeFilter={titleFilter}
        />

        <CommandListContainer>
          {filteredMenuItems.length > 0 && (
            <AddFilterVirtualList menuItems={filteredMenuItems} onClose={onClose} />
          )}

          {/* No results */}
          {filteredMenuItems.length == 0 && (
            <Box padding={3}>
              <Text muted size={1} textOverflow="ellipsis">
                No matches for '{titleFilter}'
              </Text>
            </Box>
          )}
        </CommandListContainer>
      </Flex>
    </CommandListProvider>
  )
}
