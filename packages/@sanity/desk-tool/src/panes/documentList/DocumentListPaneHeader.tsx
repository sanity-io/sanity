import {MenuItem as MenuItemType, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {ArrowLeftIcon, UnknownIcon} from '@sanity/icons'
import {InitialValueTemplateItem, StructureBuilder as S} from '@sanity/structure'
import {SchemaType} from '@sanity/types'
import {Box, Button, Inline, Text, Tooltip} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo} from 'react'
import {IntentButton} from '../../components/IntentButton'
import {PaneContextMenuButton, PaneHeader, usePane} from '../../components/pane'
import {useDeskTool} from '../../contexts/deskTool'
import {BackLink} from '../../contexts/paneRouter'
import {DeskToolPaneActionHandler} from '../../types/types'
import {Layout, SortOrder} from './types'
import {CreateMenuButton} from './CreateMenuButton'

/**
 * Detects whether a menu item is the default create menu item.
 *
 * It’s used to figure out which menu item we should replace, so we can render
 * the template menu instead.
 *
 * NOTE: this feels like a rather hacky solution, which should be replaced when
 * providing correctly prepared `menuItems` to `DocumentListPane`.
 *
 * @todo: remove this when `menuItems` are correctly provided.
 */
function isDefaultCreateActionItem(actionItem: MenuItemType, schemaType: SchemaType | null) {
  const intent = actionItem.intent
  const intentParams: any = typeof intent?.params === 'object' ? intent.params : {}

  return (
    intent &&
    schemaType &&
    actionItem.title === `Create new ${schemaType.title}` &&
    intent.type === 'create' &&
    intentParams.type === schemaType.name &&
    intentParams.template === schemaType.name &&
    typeof actionItem.showAsAction === 'object' &&
    actionItem.showAsAction.whenCollapsed === true
  )
}

export function DocumentListPaneHeader(props: {
  index: number
  initialValueTemplates?: InitialValueTemplateItem[]
  menuItems?: MenuItemType[]
  menuItemGroups?: MenuItemGroup[]
  schemaTypeName?: string
  setLayout: (layout: Layout) => void
  setSortOrder: (sortOrder: SortOrder) => void
  title: string
}) {
  const {
    index,
    initialValueTemplates,
    menuItems: menuItemsProp,
    menuItemGroups,
    schemaTypeName,
    setLayout,
    setSortOrder,
    title,
  } = props
  const {features} = useDeskTool()
  const {collapsed} = usePane()
  const schemaType: SchemaType | null = schemaTypeName ? schema.get(schemaTypeName) : null

  const actionHandlers: Record<string, DeskToolPaneActionHandler> = useMemo(
    () => ({
      setLayout: ({layout: value}: {layout: Layout}) => {
        setLayout(value)
      },
      setSortOrder: (sort: SortOrder) => {
        setSortOrder(sort)
      },
    }),
    [setLayout, setSortOrder]
  )

  const handleAction = useCallback(
    (item: MenuItemType) => {
      const handler =
        // eslint-disable-next-line no-nested-ternary
        typeof item.action === 'function'
          ? item.action
          : typeof item.action === 'string'
          ? actionHandlers[item.action]
          : null

      if (handler) {
        handler(item.params)
        return true
      }

      return false
    },
    [actionHandlers]
  )

  const createMenuItems: MenuItemType[] = useMemo(
    () =>
      initialValueTemplates
        ? (S.menuItemsFromInitialValueTemplateItems(initialValueTemplates) as any)
        : [],
    [initialValueTemplates]
  )

  const [actionItems, menuItems] = useMemo(() => {
    if (!menuItemsProp) {
      return [[], []]
    }

    const _actionItems: MenuItemType[] = []
    const _menuItems: MenuItemType[] = []

    for (const menuItem of menuItemsProp) {
      const {showAsAction} = menuItem

      const isActionItem =
        showAsAction &&
        (!collapsed || (typeof showAsAction === 'object' && showAsAction.whenCollapsed))

      if (isActionItem) {
        _actionItems.push(menuItem)
      } else {
        _menuItems.push(menuItem)
      }
    }

    return [_actionItems, _menuItems]
  }, [collapsed, menuItemsProp])

  const contextMenu = useMemo(
    () =>
      menuItems.length ? (
        <PaneContextMenuButton
          items={menuItems}
          itemGroups={menuItemGroups}
          key="$contextMenu"
          onAction={handleAction}
        />
      ) : null,
    [handleAction, menuItems, menuItemGroups]
  )

  const actions = useMemo(() => {
    let foundCreateButton = false

    const actionNodes = actionItems.map((action, actionIndex) => {
      // Replace the "Create" button when there are multiple initial value templates
      if (createMenuItems.length > 1 && isDefaultCreateActionItem(action, schemaType)) {
        foundCreateButton = true
        return <CreateMenuButton items={createMenuItems} />
      }

      if (action.intent) {
        return (
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>{action.title}</Text>
              </Box>
            }
            disabled={!action.title}
            key={action.key || actionIndex}
            placement="bottom"
          >
            <IntentButton
              aria-label={String(action.title)}
              icon={action.icon || UnknownIcon}
              intent={action.intent}
              key={action.key || actionIndex}
              mode="bleed"
            />
          </Tooltip>
        )
      }

      return null
    })

    const createMenuButton =
      foundCreateButton || createMenuItems.length <= 1 ? null : (
        <CreateMenuButton items={createMenuItems} />
      )

    return <Inline space={1}>{[...actionNodes, createMenuButton, contextMenu]}</Inline>
  }, [actionItems, createMenuItems, contextMenu, schemaType])

  return (
    <PaneHeader
      actions={actions}
      backButton={
        features.backButton &&
        index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
      }
      title={title}
    />
  )
}
