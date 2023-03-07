import {Box, Flex, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {CommandListProvider} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useSearchState} from '../../../contexts/search/useSearchState'
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

  const values = useMemo(() => {
    return filteredMenuItems.map((i) => ({
      enabled: i.type === 'filter',
      value: i,
    }))
  }, [filteredMenuItems])

  return (
    <CommandListProvider
      activeItemDataAttr="data-hovered"
      ariaActiveDescendant={values.length > 0}
      ariaChildrenLabel="Filters"
      ariaInputLabel="Filter by title"
      autoFocus
      values={values}
    >
      <Flex direction="column" style={{width: '300px'}}>
        {/* Filter header */}
        <FilterPopoverContentHeader
          onChange={handleFilterChange}
          onClear={handleFilterClear}
          typeFilter={titleFilter}
        />

        <Flex>
          {values.length > 0 && (
            <AddFilterVirtualList menuItems={filteredMenuItems} onClose={onClose} />
          )}

          {/* No results */}
          {values.length == 0 && (
            <Box padding={3}>
              <Text muted size={1} textOverflow="ellipsis">
                No matches for '{titleFilter}'
              </Text>
            </Box>
          )}
        </Flex>
      </Flex>
    </CommandListProvider>
  )
}
