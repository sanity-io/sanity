import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, Card, Code, Stack, TextInput} from '@sanity/ui'
import shallowEquals from 'shallow-equals'
import {isEqual} from 'lodash'
import {SearchIcon} from '@sanity/icons'
import styled, {css} from 'styled-components'
import {Pane} from '../../components/pane'
import {_DEBUG} from '../../constants'
import {useDeskToolSetting} from '../../useDeskToolSetting'
import {BaseDeskToolPaneProps} from '../types'
import {PaneMenuItem} from '../../types'
import {useInputType} from '../../input-type'
import {DEFAULT_ORDERING, EMPTY_RECORD} from './constants'
import {
  applyOrderingFunctions,
  getTypeNameFromSingleTypeFilter,
  isSimpleTypeFilter,
} from './helpers'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {DocumentListPaneHeader} from './DocumentListPaneHeader'
import {SortOrder} from './types'
import {useDocumentList} from './useDocumentList'
import {GeneralPreviewLayoutKey, SourceProvider, useSchema, useSource, useUnique} from 'sanity'

type DocumentListPaneProps = BaseDeskToolPaneProps<'documentList'>

const EMPTY_ARRAY: never[] = []

const SearchCard = styled(Card)(({theme}) => {
  const radius = theme.sanity.radius[4]

  return css`
    border-radius: ${radius}px;

    [data-ui='TextInput'] {
      border-radius: inherit;
    }

    &[data-focus-visible='false'] {
      [data-ui='TextInput'] {
        box-shadow: none;
        span {
          box-shadow: none;
        }
        --card-focus-ring-color: transparent;
      }
    }
  `
})

function useShallowUnique<ValueType>(value: ValueType): ValueType {
  const valueRef = useRef<ValueType>(value)
  if (!shallowEquals(valueRef.current, value)) {
    valueRef.current = value
  }
  return valueRef.current
}

const addSelectedStateToMenuItems = (options: {
  menuItems?: PaneMenuItem[]
  sortOrder?: SortOrder
  layout?: GeneralPreviewLayoutKey
}) => {
  const {menuItems, sortOrder, layout} = options

  return menuItems?.map((item) => {
    if (item.params?.layout) {
      return {
        ...item,
        selected: layout === item.params?.layout,
      }
    }

    if (item?.params?.extendedProjection) {
      return {
        ...item,
        selected: sortOrder?.extendedProjection === item?.params?.extendedProjection,
      }
    }

    if (item?.params?.by) {
      return {
        ...item,
        selected: isEqual(sortOrder?.by, item?.params?.by || EMPTY_ARRAY),
      }
    }

    return {...item, selected: false}
  })
}

/**
 * @internal
 */
export const DocumentListPane = memo(function DocumentListPane(props: DocumentListPaneProps) {
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props
  const schema = useSchema()
  const {name: parentSourceName} = useSource()
  const {
    defaultLayout = 'default',
    displayOptions,
    initialValueTemplates = EMPTY_ARRAY,
    menuItems,
    menuItemGroups,
    options,
    title,
  } = pane
  const {apiVersion, defaultOrdering = EMPTY_ARRAY, filter} = options
  const params = useShallowUnique(options.params || EMPTY_RECORD)
  const sourceName = pane.source
  const typeName = useMemo(() => getTypeNameFromSingleTypeFilter(filter, params), [filter, params])
  const showIcons = displayOptions?.showIcons !== false
  const [layout, setLayout] = useDeskToolSetting<GeneralPreviewLayoutKey>(
    typeName,
    'layout',
    defaultLayout
  )

  const inputType = useInputType()

  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null)

  // Ensure that we use the defaultOrdering value from structure builder if any as the default
  const defaultSortOrder = useMemo(() => {
    return defaultOrdering?.length > 0 ? {by: defaultOrdering} : DEFAULT_ORDERING
  }, [defaultOrdering])

  const [sortOrderRaw, setSortOrder] = useDeskToolSetting<SortOrder>(
    typeName,
    'sortOrder',
    defaultSortOrder
  )

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)
  const filterIsSimpleTypeConstraint = isSimpleTypeFilter(filter)

  const noDocumentsMessage = useMemo(() => {
    if (searchQuery) {
      return (
        <>
          {`No documents found matching`} <b>”{searchQuery}”</b>
        </>
      )
    }

    if (filterIsSimpleTypeConstraint) {
      return `No documents of type ${typeName} found`
    }

    return 'No documents found'
  }, [filterIsSimpleTypeConstraint, searchQuery, typeName])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, [])

  const handleClearSearch = useCallback(() => setSearchQuery(null), [])

  // Reset search query on "Escape" key press
  const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchQuery(null)
    }
  }, [])

  const filterWithSearchQuery = useMemo(() => {
    if (searchQuery) {
      // Pick the preview field for the type
      const previewField = schema.get(typeName || '')?.preview?.select?.title

      // Use the filter + the preview field match query to filter the list
      const filterAndSearch = `${filter} && ${previewField} match "*${searchQuery}*"`

      return filterAndSearch
    }
    return filter
  }, [filter, searchQuery, schema, typeName])

  const {
    error,
    // fullList, // TODO: DO WE NEED THIS?
    handleListChange,
    isLoading,
    items,
    onRetry,
  } = useDocumentList({
    filter: filterWithSearchQuery,
    params,
    sortOrder,
    apiVersion,
  })

  const menuItemsWithSelectedState = useMemo(
    () =>
      addSelectedStateToMenuItems({
        menuItems,
        sortOrder,
        layout,
      }),
    [layout, menuItems, sortOrder]
  )

  // Clear search field when switching between panes
  useEffect(() => {
    setSearchQuery(null)
  }, [paneKey])

  return (
    <SourceProvider name={sourceName || parentSourceName}>
      <Pane currentMaxWidth={350} id={paneKey} maxWidth={640} minWidth={320} selected={isSelected}>
        {_DEBUG && (
          <Card padding={4} tone="transparent">
            <Code>{pane.source || '(none)'}</Code>
          </Card>
        )}

        <Stack>
          <DocumentListPaneHeader
            index={index}
            initialValueTemplates={initialValueTemplates}
            menuItems={menuItemsWithSelectedState}
            menuItemGroups={menuItemGroups}
            setLayout={setLayout}
            setSortOrder={setSortOrder}
            title={title}
            content={
              <Box paddingX={3} paddingBottom={2}>
                <SearchCard tone="transparent" data-focus-visible={inputType === 'keyboard'}>
                  <TextInput
                    border={false}
                    clearButton={Boolean(searchQuery)}
                    fontSize={1}
                    icon={SearchIcon}
                    onChange={handleSearchChange}
                    onClear={handleClearSearch}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search"
                    radius={2}
                    ref={setSearchInputElement}
                    value={searchQuery || ''}
                  />
                </SearchCard>
              </Box>
            }
          />
        </Stack>

        <DocumentListPaneContent
          childItemId={childItemId}
          error={error}
          // fullList={fullList} // TODO: DO WE NEED THIS?
          isActive={isActive}
          isLoading={isLoading}
          items={items}
          layout={layout}
          noDocumentsMessage={noDocumentsMessage}
          onRetry={onRetry}
          searchInputElement={searchInputElement}
          showIcons={showIcons}
          onListChange={handleListChange}
        />
      </Pane>
    </SourceProvider>
  )
})
