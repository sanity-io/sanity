import {Card, Code} from '@sanity/ui'
import isEqual from 'lodash-es/isEqual.js'
import {memo, useCallback, useMemo, useState} from 'react'
import {
  EMPTY_ARRAY,
  type GeneralDocumentListLayoutKey,
  type ObjectSchemaType,
  SourceProvider,
  useI18nText,
  useSchema,
  useSource,
  useTranslation,
} from 'sanity'
import shallowEquals from 'shallow-equals'

import {Pane} from '../../components/pane'
import {_DEBUG} from '../../constants'
import {structureLocaleNamespace} from '../../i18n'
import {assignId} from '../../structureResolvers/assignId'
import {type PaneMenuItem} from '../../types'
import {useStructureToolSetting} from '../../useStructureToolSetting'
import {type BaseStructureToolPaneProps} from '../types'
import {DEFAULT_ORDERING, EMPTY_RECORD} from './constants'
import {DocumentListPane} from './DocumentListPane'
import {findStaticTypesInFilter, validateSortOrder} from './helpers'
import {PaneHeader} from './PaneHeader'
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

/**
 * @internal exported for testing
 */
export const addSelectedStateToMenuItems = (options: {
  menuItems?: PaneMenuItem[]
  sortOrderRaw?: SortOrder
  layout?: GeneralDocumentListLayoutKey
  customMenuItemState?: CustomMenuItemState
  schemaType?: ObjectSchemaType
  disabledSortReason?: string
}) => {
  const {
    menuItems,
    sortOrderRaw,
    layout,
    customMenuItemState = {},
    schemaType,
    disabledSortReason,
  } = options

  return menuItems?.map((item) => {
    if (item.params?.layout) {
      return {
        ...item,
        selected: layout === item.params?.layout,
      }
    }

    if (item?.params?.by) {
      const itemSortOrder: SortOrder = {by: item.params.by}
      const isInvalidSortOrder =
        validateSortOrder(itemSortOrder, schemaType, DEFAULT_ORDERING) !== itemSortOrder

      return {
        ...item,
        selected: isEqual(sortOrderRaw?.by, item?.params?.by || EMPTY_ARRAY),
        ...(isInvalidSortOrder && {
          disabled: {reason: disabledSortReason},
        }),
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

  const schema = useSchema()
  const schemaType = useMemo(
    () => (typeName ? (schema.get(typeName) as ObjectSchemaType | undefined) : undefined),
    [typeName, schema],
  )
  const {t} = useTranslation(structureLocaleNamespace)

  const validatedSortOrder = useMemo(() => {
    if (!sortOrderRaw) return sortOrderRaw
    return validateSortOrder(sortOrderRaw, schemaType, defaultSortOrder)
  }, [sortOrderRaw, schemaType, defaultSortOrder])

  const handleSetSortOrder = useCallback(
    async (newSortOrder: SortOrder) => {
      const validated = validateSortOrder(newSortOrder, schemaType, defaultSortOrder)
      await setSortOrder(validated)
    },
    [setSortOrder, schemaType, defaultSortOrder],
  )

  const [customMenuItemState, setCustomMenuItemState] = useState<CustomMenuItemState>({})

  const menuItemsWithIds = useMemo(() => addIdsToMenuItems(menuItems), [menuItems])

  const disabledSortReason = t('panes.document-list-pane.sort-order.disabled-reason')

  const menuItemsWithSelectedState = useMemo(
    () =>
      addSelectedStateToMenuItems({
        menuItems: menuItemsWithIds,
        sortOrderRaw: validatedSortOrder,
        layout,
        customMenuItemState,
        schemaType,
        disabledSortReason,
      }),
    [
      customMenuItemState,
      disabledSortReason,
      layout,
      menuItemsWithIds,
      schemaType,
      validatedSortOrder,
    ],
  )

  return (
    <SourceProvider name={sourceName || parentSourceName}>
      <Pane
        data-ui="DocumentListPane"
        id={paneKey}
        minWidth={320}
        currentMaxWidth={350}
        maxWidth={640}
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
          setSortOrder={handleSetSortOrder}
          setCustomMenuItemState={setCustomMenuItemState}
          title={title}
        />
        <DocumentListPane {...props} sortOrder={validatedSortOrder} layout={layout} />
      </Pane>
    </SourceProvider>
  )
})
PaneContainer.displayName = 'Memo(PaneContainer)'
