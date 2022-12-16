import React, {memo, useMemo, useRef} from 'react'
import {Card, Code} from '@sanity/ui'
import shallowEquals from 'shallow-equals'
import {Pane} from '../../components/pane'
import {_DEBUG} from '../../constants'
import {useDeskToolSetting} from '../../useDeskToolSetting'
import {BaseDeskToolPaneProps} from '../types'
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

const emptyArray: never[] = []

function useShallowUnique<ValueType>(value: ValueType): ValueType {
  const valueRef = useRef<ValueType>(value)
  if (!shallowEquals(valueRef.current, value)) {
    valueRef.current = value
  }
  return valueRef.current
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
    initialValueTemplates = emptyArray,
    menuItems,
    menuItemGroups,
    options,
    title,
  } = pane
  const {apiVersion, defaultOrdering = emptyArray, filter} = options
  const params = useShallowUnique(options.params || EMPTY_RECORD)
  const sourceName = pane.source
  const typeName = useMemo(() => getTypeNameFromSingleTypeFilter(filter, params), [filter, params])
  const showIcons = displayOptions?.showIcons !== false
  const [layout, setLayout] = useDeskToolSetting<GeneralPreviewLayoutKey>(
    typeName,
    'layout',
    defaultLayout
  )

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
  const filterIsSimpleTypeContraint = isSimpleTypeFilter(filter)

  const {error, fullList, handleListChange, isLoading, items, onRetry} = useDocumentList({
    filter,
    params,
    sortOrder,
    apiVersion,
  })

  return (
    <SourceProvider name={sourceName || parentSourceName}>
      <Pane currentMaxWidth={350} id={paneKey} maxWidth={640} minWidth={320} selected={isSelected}>
        {_DEBUG && (
          <Card padding={4} tone="transparent">
            <Code>{pane.source || '(none)'}</Code>
          </Card>
        )}

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
    </SourceProvider>
  )
})
