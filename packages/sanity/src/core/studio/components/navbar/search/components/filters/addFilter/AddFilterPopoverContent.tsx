import {Box, Flex, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {useSchema} from '../../../../../../../hooks'
import {CommandListProvider} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {AddFilterVirtualList} from './AddFilterVirtualList'
import {createFilterMenuItems} from './createFilterMenuItems'

interface AddFilterPopoverContentProps {
  onClose: () => void
}

export function AddFilterPopoverContent({onClose}: AddFilterPopoverContentProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
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
      childContainerElement={childContainerElement}
      containerElement={containerElement}
      itemIndices={itemIndices}
    >
      <Flex direction="column" style={{width: '300px'}}>
        {/* Filter header */}
        <FilterPopoverContentHeader
          onChange={handleFilterChange}
          onClear={handleFilterClear}
          typeFilter={titleFilter}
        />

        <Box flex={1} ref={setContainerRef}>
          {filteredMenuItems.length > 0 && (
            <AddFilterVirtualList
              menuItems={filteredMenuItems}
              onClose={onClose}
              setChildContainerRef={setChildContainerRef}
            />
          )}

          {/* No results */}
          {filteredMenuItems.length == 0 && (
            <Box padding={3}>
              <Text muted size={1} textOverflow="ellipsis">
                No matches for '{titleFilter}'
              </Text>
            </Box>
          )}
        </Box>
      </Flex>
    </CommandListProvider>
  )
}
