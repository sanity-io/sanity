import {type Schema, type SchemaType} from '@sanity/types'
import {Box, Flex, MenuDivider, Stack, Text} from '@sanity/ui'
import {partition} from 'lodash'
import {type KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../../../../../ui-components'
import {
  CommandList,
  type CommandListGetItemSelectedCallback,
  type CommandListHandle,
  type CommandListRenderItemCallback,
} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useTranslation} from '../../../../../../../i18n'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {type DocumentTypeMenuItem} from '../../../types'
import {getSelectableOmnisearchTypes} from '../../../utils/selectors'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {DocumentTypeFilterItem} from './items/DocumentTypeFilterItem'

const ClearButtonBox = styled(Box)`
  border-top: 1px solid ${({theme}) => theme.sanity.color.base.border};
  flex-shrink: 0;
`

const POPOVER_STYLES = {width: '250px'}

export function DocumentTypesPopoverContent() {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const commandListRef = useRef<CommandListHandle | null>(null)
  const {t} = useTranslation()

  const schema = useSchema()

  const {
    dispatch,
    state: {
      terms: {types: selectedTypes},
    },
  } = useSearchState()

  // Get a snapshot of initial selected types
  const [selectedTypesSnapshot, setSelectedTypesSnapshot] = useState(selectedTypes)

  const documentTypeItems = useGetDocumentTypeItems(
    schema,
    selectedTypes,
    selectedTypesSnapshot,
    typeFilter,
  )

  const handleFilterChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter],
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const handleTypesClear = useCallback(() => {
    setSelectedTypesSnapshot([])
    dispatch({type: 'TERMS_TYPES_CLEAR'})

    // Re-focus the command list input element
    commandListRef?.current?.focusInputElement()
    commandListRef?.current?.scrollToIndex(0)
  }, [dispatch])

  const getItemKey = useCallback(
    (index: number) => {
      const virtualItem = documentTypeItems[index]
      switch (virtualItem.type) {
        case 'divider':
          return `${virtualItem.type}-${index}`
        case 'header':
          return `${virtualItem.type}-${virtualItem.title}`
        case 'item':
          return `${virtualItem.type}-${virtualItem.item.name}`
        default:
          return index
      }
    },
    [documentTypeItems],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<DocumentTypeMenuItem>>((item) => {
    if (item.type === 'divider') {
      return (
        <Box paddingY={1}>
          <MenuDivider />
        </Box>
      )
    }
    if (item.type === 'header') {
      return (
        <Box margin={2} padding={1}>
          <Text muted size={1} weight="medium">
            {item.title}
          </Text>
        </Box>
      )
    }
    if (item.type === 'item') {
      return <DocumentTypeFilterItem paddingBottom={1} selected={item.selected} type={item.item} />
    }
    return null
  }, [])

  const getItemDisabled = useCallback<CommandListGetItemSelectedCallback>(
    (index) => {
      const item = documentTypeItems[index]
      return item.type !== 'item'
    },
    [documentTypeItems],
  )

  const getItemSelected = useCallback<CommandListGetItemSelectedCallback>(
    (index) => {
      const item = documentTypeItems[index]
      return item.type === 'item' && item.selected
    },
    [documentTypeItems],
  )

  return (
    <Flex direction="column" style={POPOVER_STYLES}>
      {/* Search header */}
      <FilterPopoverContentHeader
        ariaInputLabel={t('search.action.filter-by-document-type-aria-label')}
        onChange={handleFilterChange}
        onClear={handleFilterClear}
        ref={setInputElement}
        typeFilter={typeFilter}
      />

      <Flex>
        {documentTypeItems.length > 0 && (
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={t('search.document-types-aria-label')}
            ariaMultiselectable
            autoFocus="input"
            getItemDisabled={getItemDisabled}
            getItemSelected={getItemSelected}
            getItemKey={getItemKey}
            inputElement={inputElement}
            itemHeight={37}
            items={documentTypeItems}
            overscan={20}
            padding={1}
            paddingBottom={0}
            ref={commandListRef}
            renderItem={renderItem}
          />
        )}

        {/* No results */}
        {!documentTypeItems.length && (
          <Box padding={3}>
            <Text muted size={1} textOverflow="ellipsis">
              {t('search.document-types-no-matches-found', {filter: typeFilter})}
            </Text>
          </Box>
        )}
      </Flex>

      {/* Clear button */}
      {!typeFilter && selectedTypes.length > 0 && (
        <ClearButton onClick={handleTypesClear} selectedTypes={selectedTypes} />
      )}
    </Flex>
  )
}

function ClearButton({onClick, selectedTypes}: {onClick: () => void; selectedTypes: SchemaType[]}) {
  const {t} = useTranslation()

  return (
    <ClearButtonBox padding={1}>
      <Stack>
        <Button
          aria-label={t('search.action.clear-type-filters-aria-label')}
          data-name="type-filter-button"
          disabled={selectedTypes.length === 0}
          mode="bleed"
          onClick={onClick}
          text={t('search.action.clear-type-filters-label')}
          tone="primary"
        />
      </Stack>
    </ClearButtonBox>
  )
}

function useGetDocumentTypeItems(
  schema: Schema,
  selectedTypes: SchemaType[],
  selectedTypesSnapshot: SchemaType[],
  typeFilter: string,
) {
  return useMemo(() => {
    const [itemsSelected, itemsUnselected] = partition(
      getSelectableOmnisearchTypes(schema, typeFilter),
      (type) => selectedTypesSnapshot.includes(type),
    )

    const hasSelectedItems = itemsSelected.length > 0
    const hasUnselectedItems = itemsSelected.length > 0

    const items: DocumentTypeMenuItem[] = []
    if (hasSelectedItems) {
      items.push({title: 'Selected', type: 'header'})
    }
    itemsSelected.forEach((item) =>
      items.push({item, selected: selectedTypes.includes(item), type: 'item'}),
    )
    if (hasSelectedItems && hasUnselectedItems) {
      items.push({type: 'divider'})
    }
    itemsUnselected.forEach((item) =>
      items.push({item, selected: selectedTypes.includes(item), type: 'item'}),
    )

    return items
  }, [schema, selectedTypes, selectedTypesSnapshot, typeFilter])
}
