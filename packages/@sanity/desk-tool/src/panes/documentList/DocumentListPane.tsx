import React, {memo, useMemo} from 'react'
import {Pane} from '../../components/pane'
import {useShallowUnique} from '../../utils/useShallowUnique'
import {useUnique} from '../../utils/useUnique'
import {useDeskToolSetting} from '../../settings'
import {BaseDeskToolPaneProps} from '../types'
import {DEFAULT_ORDERING, EMPTY_RECORD} from './constants'
import {getTypeNameFromSingleTypeFilter, isSimpleTypeFilter} from './helpers'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {DocumentListPaneHeader} from './DocumentListPaneHeader'
import {Layout, SortOrder} from './types'
import {useDocumentList} from './useDocumentList'

type DocumentListPaneProps = BaseDeskToolPaneProps<'documentList'>

const emptyArray: never[] = []

/**
 * @internal
 */
export const DocumentListPane = memo(function DocumentListPane(props: DocumentListPaneProps) {
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props
  const {
    defaultLayout = 'default',
    displayOptions,
    initialValueTemplates = emptyArray,
    menuItems,
    menuItemGroups,
    options,
    title,
  } = pane

  const {defaultOrdering = emptyArray, filter, apiVersion} = options
  const params = useShallowUnique(options.params || EMPTY_RECORD)
  const typeName = useMemo(() => getTypeNameFromSingleTypeFilter(filter, params), [filter, params])
  const showIcons = displayOptions?.showIcons !== false
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
    apiVersion,
  })

  return (
    <Pane currentMaxWidth={350} id={paneKey} maxWidth={640} minWidth={320} selected={isSelected}>
      <DocumentListPaneHeader
        index={index}
        initialValueTemplates={initialValueTemplates}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
        setLayout={setLayout}
        setSortOrder={setSortOrder}
        title={title}
      />

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
    </Pane>
  )
})
