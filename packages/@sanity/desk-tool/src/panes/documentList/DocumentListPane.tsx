import {MenuItem as MenuItemType, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {InitialValueTemplateItem} from '@sanity/structure'
import React, {memo, useMemo} from 'react'
import {Pane} from '../../components/pane'
import {useShallowUnique} from '../../lib/useShallowUnique'
import {useUnique} from '../../lib/useUnique'
import {useDeskToolSetting} from '../../settings'
import {BaseDeskToolPaneProps} from '../types'
import {DEFAULT_ORDERING, EMPTY_RECORD} from './constants'
import {getTypeNameFromSingleTypeFilter, isSimpleTypeFilter} from './helpers'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {DocumentListPaneHeader} from './DocumentListPaneHeader'
import {Layout, SortOrder, SortOrderBy} from './types'
import {useDocumentList} from './useDocumentList'

type DocumentListPaneProps = BaseDeskToolPaneProps<{
  childItemId: string
  displayOptions?: {showIcons?: boolean}
  defaultLayout?: Layout
  menuItems?: MenuItemType[]
  menuItemGroups?: MenuItemGroup[]
  initialValueTemplates?: InitialValueTemplateItem[]
  options: {
    filter: string
    defaultOrdering: SortOrderBy[]
    params?: Record<string, unknown>
  }
  schemaTypeName?: string
  title: string
}>

/**
 * @internal
 */
export const DocumentListPane = memo(function DocumentListPane(props: DocumentListPaneProps) {
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props
  const {
    defaultLayout = 'default',
    displayOptions = {},
    initialValueTemplates,
    menuItems,
    menuItemGroups,
    options,
    schemaTypeName,
    title,
  } = pane

  const {defaultOrdering, filter} = options
  const params = useShallowUnique(options.params || EMPTY_RECORD)
  const typeName = useMemo(() => getTypeNameFromSingleTypeFilter(filter, params), [filter, params])
  const showIcons = displayOptions.showIcons !== false
  const [layout, setLayout] = useDeskToolSetting<Layout>(typeName, 'layout', defaultLayout)
  const [sortOrderRaw, setSortOrder] = useDeskToolSetting<SortOrder>(
    typeName,
    'sortOrder',
    DEFAULT_ORDERING
  )
  const sortOrder = useUnique(sortOrderRaw)
  const filterIsSimpleTypeContraint = isSimpleTypeFilter(filter)

  const {error, fullList, handleListChange, isLoading, items, onRetry} = useDocumentList({
    defaultOrdering,
    filter,
    params,
    sortOrder,
  })

  const header = useMemo(
    () => (
      <DocumentListPaneHeader
        index={index}
        initialValueTemplates={initialValueTemplates}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
        schemaTypeName={schemaTypeName}
        setLayout={setLayout}
        setSortOrder={setSortOrder}
        title={title}
      />
    ),
    [
      index,
      initialValueTemplates,
      menuItems,
      menuItemGroups,
      schemaTypeName,
      setLayout,
      setSortOrder,
      title,
    ]
  )

  const content = useMemo(
    () => (
      <DocumentListPaneContent
        childItemId={childItemId}
        error={error}
        filterIsSimpleTypeContraint={filterIsSimpleTypeContraint}
        fullList={fullList}
        isActive={isActive}
        isLoading={isLoading}
        items={items}
        layout={layout}
        onListChange={handleListChange}
        onRetry={onRetry}
        showIcons={showIcons}
      />
    ),
    [
      childItemId,
      error,
      filterIsSimpleTypeContraint,
      fullList,
      isActive,
      isLoading,
      items,
      layout,
      handleListChange,
      onRetry,
      showIcons,
    ]
  )

  return useMemo(
    () => (
      <Pane
        currentMaxWidth={350}
        data-index={index}
        data-pane-key={paneKey}
        maxWidth={640}
        minWidth={320}
        selected={isSelected}
      >
        {header}
        {content}
      </Pane>
    ),
    [content, header, index, isSelected, paneKey]
  )
})
