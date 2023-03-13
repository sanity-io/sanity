import {Box, Flex, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {CommandList, CommandListVirtualItemProps} from '../../../../../../../components'
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
  const [inputElement, setInputElement] = useState<HTMLElement | null>(null)
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

  const renderItem = useCallback(
    (item: CommandListVirtualItemProps<FilterMenuItem>) => {
      if (item.value.type === 'filter') {
        return <MenuItemFilter item={item.value} onClose={onClose} paddingTop={1} paddingX={1} />
      }
      if (item.value.type === 'header') {
        return <MenuItemHeader item={item.value} />
      }
      return null
    },
    [onClose]
  )

  const getItemKey = useCallback(
    (index: number) => {
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
    [filteredMenuItems]
  )

  return (
    <Flex direction="column" style={{width: '300px'}}>
      {/* Filter header */}
      <FilterPopoverContentHeader
        ariaInputLabel="Filter by title"
        onChange={handleFilterChange}
        onClear={handleFilterClear}
        ref={setInputElement}
        typeFilter={titleFilter}
      />

      <Flex>
        {values.length > 0 && (
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="Filters"
            autoFocus
            getItemKey={getItemKey}
            inputElement={inputElement}
            itemHeight={45}
            overscan={20}
            paddingBottom={1}
            renderItem={renderItem}
            values={values}
          />
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
  )
}
