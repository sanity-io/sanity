import {Card, Code} from '@sanity/ui'
import {isEqual} from 'lodash-es'
import {memo, useMemo, useState} from 'react'
import {
  EMPTY_ARRAY,
  type GeneralDocumentListLayoutKey,
  SourceProvider,
  useI18nText,
  useSource,
} from 'sanity'
import shallowEquals from 'shallow-equals'

import {Pane} from '../../components/pane'
import {_DEBUG} from '../../constants'
import {assignId} from '../../structureResolvers/assignId'
import {type PaneMenuItem} from '../../types'
import {useStructureToolSetting} from '../../useStructureToolSetting'
import {type BaseStructureToolPaneProps} from '../types'
import {DEFAULT_ORDERING, EMPTY_RECORD} from './constants'
import {DocumentListPane} from './DocumentListPane'
import {findStaticTypesInFilter} from './helpers'
import {PaneHeader} from './PaneHeader'
import {DocumentSheetListPane} from './sheetList/DocumentSheetListPane'
import {type SortOrder} from './types'

/**
 * Type for custom menu item state storage.
 * Maps menu item IDs to their current state values.
 */
type CustomMenuItemState = Record<string, unknown>

/**
 * Adds auto-generated IDs to menu items that don't have one.
 */
const addIdsToMenuItems = (menuItems?: PaneMenuItem[]): PaneMenuItem[] | undefined => {
  return menuItems?.map((item) => {
    if (item.id) return item
    return {...item, id: assignId(item)}
  })
}

const addSelectedStateToMenuItems = (options: {
  menuItems?: PaneMenuItem[]
  sortOrderRaw?: SortOrder
  layout?: GeneralDocumentListLayoutKey
  customMenuItemState?: CustomMenuItemState
}) => {
  const {menuItems, sortOrderRaw, layout, customMenuItemState = {}} = options

  return menuItems?.map((item) => {
    if (item.params?.layout) {
      return {
        ...item,
        selected: layout === item.params?.layout,
      }
    }

    if (item?.params?.by) {
      return {
        ...item,
        selected: isEqual(sortOrderRaw?.by, item?.params?.by || EMPTY_ARRAY),
      }
    }

    // Check custom menu item state by id
    if (item.id && item.id in customMenuItemState) {
      const storedValue = customMenuItemState[item.id]
      const itemValue = item.params?.value ?? true
      return {
        ...item,
        selected: isEqual(storedValue, itemValue),
      }
    }

    // Preserve any existing selected state, default to false
    return {...item, selected: item.selected ?? false}
  })
}

export function useShallowUnique<ValueType>(value: ValueType): ValueType {
  const [previous, setPrevious] = useState<ValueType>(value)
  if (!shallowEquals(previous, value)) {
    setPrevious(value)
    return value
  }
  return previous
}

/**
 * @internal
 */
export const PaneContainer = memo(function PaneContainer(
  props: BaseStructureToolPaneProps<'documentList'>,
) {
  const {index, isSelected, pane, paneKey} = props
  const {name: parentSourceName} = useSource()

  const {
    defaultLayout = 'default',
    initialValueTemplates = EMPTY_ARRAY,
    menuItemGroups,
    menuItems,
    options,
  } = pane
  const {defaultOrdering = EMPTY_ARRAY, filter} = options
  const params = useShallowUnique(options.params || EMPTY_RECORD)
  const sourceName = pane.source
  const typeName = useMemo(() => {
    const staticTypes = findStaticTypesInFilter(filter, params)
    if (staticTypes?.length === 1) return staticTypes[0]
    return null
  }, [filter, params])

  const [layout, setLayout] = useStructureToolSetting<GeneralDocumentListLayoutKey>(
    'layout',
    typeName ?? pane.id, //pane.id for anything that is not documentTypeList
    defaultLayout,
  )

  const {title} = useI18nText(pane)

  // Ensure that we use the defaultOrdering value from structure builder if any as the default
  const defaultSortOrder = useMemo(() => {
    return defaultOrdering?.length > 0 ? {by: defaultOrdering} : DEFAULT_ORDERING
  }, [defaultOrdering])

  const [sortOrderRaw, setSortOrder] = useStructureToolSetting<SortOrder>(
    'sort-order',
    typeName ?? pane.id, //pane.id for anything that is not documentTypeList
    defaultSortOrder,
  )

  // Custom menu item state for tracking selected state of custom menu items
  // Uses local state (doesn't persist across refreshes) to avoid keyValueStore allowlist issues
  const [customMenuItemState, setCustomMenuItemState] = useState<CustomMenuItemState>({})

  // Add auto-generated IDs to menu items that don't have one
  const menuItemsWithIds = useMemo(() => addIdsToMenuItems(menuItems), [menuItems])

  const menuItemsWithSelectedState = useMemo(
    () =>
      addSelectedStateToMenuItems({
        menuItems: menuItemsWithIds,
        sortOrderRaw,
        layout,
        customMenuItemState,
      }),
    [customMenuItemState, layout, menuItemsWithIds, sortOrderRaw],
  )

  const isSheetListLayout = layout === 'sheetList'
  const paneLayout = isSheetListLayout ? (
    <DocumentSheetListPane key={props.pane.id} {...props} />
  ) : (
    <DocumentListPane {...props} sortOrder={sortOrderRaw} layout={layout} />
  )

  return (
    <SourceProvider name={sourceName || parentSourceName}>
      <Pane
        data-ui="DocumentListPane"
        id={paneKey}
        minWidth={320}
        {...(isSheetListLayout ? {} : {currentMaxWidth: 350, maxWidth: 640})}
        selected={isSelected}
      >
        {_DEBUG && (
          <Card padding={4} tone="transparent">
            <Code>{pane.source || '(none)'}</Code>
          </Card>
        )}

        <PaneHeader
          customMenuItemState={customMenuItemState}
          index={index}
          initialValueTemplates={initialValueTemplates}
          menuItemGroups={menuItemGroups}
          menuItems={menuItemsWithSelectedState}
          setLayout={setLayout}
          setSortOrder={setSortOrder}
          setCustomMenuItemState={setCustomMenuItemState}
          title={title}
        />
        {paneLayout}
      </Pane>
    </SourceProvider>
  )
})
PaneContainer.displayName = 'Memo(PaneContainer)'
