import React, {memo, useMemo} from 'react'
import schema from 'part:@sanity/base/schema'
import {Pane} from '../../components/pane'
import {useShallowUnique} from '../../utils/useShallowUnique'
import {useUnique} from '../../utils/useUnique'
import {useDeskToolSetting} from '../../settings'
import {BaseDeskToolPaneProps} from '../types'
import {EMPTY_RECORD} from './constants'
import {
  applyOrderingFunctions,
  getTypeNameFromSingleTypeFilter,
  isSimpleTypeFilter,
} from './helpers'
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
  const defaultOrderingBy = useMemo(
    () => ({
      by: defaultOrdering,
    }),
    [defaultOrdering]
  )
  const [sortOrderRaw, setSortOrder] = useDeskToolSetting<SortOrder>(
    typeName,
    'sortOrder',
    defaultOrderingBy
  )

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName))
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)
  const filterIsSimpleTypeContraint = isSimpleTypeFilter(filter)

  const {error, fullList, handleListChange, isLoading, items, onRetry} = useDocumentList({
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
