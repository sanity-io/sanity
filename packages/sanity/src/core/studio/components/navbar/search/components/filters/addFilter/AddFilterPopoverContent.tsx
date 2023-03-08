import {Box, Flex, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {
  CommandListItems,
  CommandListProvider,
  CommandListVirtualItemProps,
} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {FilterMenuItem} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {createFilterMenuItems} from './createFilterMenuItems'
import {MenuItemFilter} from './items/MenuItemFilter'
import {MenuItemHeader} from './items/MenuItemHeader'

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
      disabled: i.type !== 'filter',
      value: i,
    }))
  }, [filteredMenuItems])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({value}: CommandListVirtualItemProps<FilterMenuItem>) {
      if (value.type === 'filter') {
        return <MenuItemFilter item={value} onClose={onClose} paddingTop={1} paddingX={1} />
      }
      if (value.type === 'header') {
        return <MenuItemHeader item={value} />
      }
      return null
    }
  }, [onClose])

  return (
    <CommandListProvider
      activeItemDataAttr="data-hovered"
      ariaChildrenLabel="Filters"
      ariaInputLabel="Filter by title"
      autoFocus
      itemComponent={VirtualListItem}
      values={values}
      virtualizerOptions={{
        estimateSize: () => 45,
        getItemKey: (index) => {
          const menuItem = filteredMenuItems[index]
          switch (menuItem.type) {
            case 'filter':
              return [
                ...(menuItem.group ? [menuItem.group] : []), //
                getFilterKey(menuItem.filter),
              ].join('-')
            case 'header':
              return `${menuItem.type}-${menuItem.title}`
            default:
              return index
          }
        },
        overscan: 20,
      }}
    >
      <Flex direction="column" style={{width: '300px'}}>
        {/* Filter header */}
        <FilterPopoverContentHeader
          onChange={handleFilterChange}
          onClear={handleFilterClear}
          typeFilter={titleFilter}
        />

        <Flex>
          {values.length > 0 && <CommandListItems paddingBottom={1} />}

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
