import {MenuItem as MenuItemType, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {ArrowLeftIcon} from '@sanity/icons'
import {InitialValueTemplateItem, StructureBuilder as S} from '@sanity/structure'
import {BoundaryElementProvider, Button, Inline} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {PaneContextMenuButton, PaneHeader} from '../../components/pane'
import {usePane} from '../../components/pane/usePane'
import {useDeskTool} from '../../contexts/deskTool'
import {usePaneRouter} from '../../contexts/paneRouter'
import {DeskToolPaneActionHandler} from '../../types'
import {IntentActionButton} from './IntentActionButton'
import {Layout, SortOrder} from './types'
import {CreateMenuButton} from './CreateMenuButton'

export function DocumentsListPaneHeader(props: {
  index: number
  initialValueTemplates?: InitialValueTemplateItem[]
  menuItems?: MenuItemType[]
  menuItemGroups?: MenuItemGroup[]
  setLayout: (layout: Layout) => void
  setSortOrder: (sortOrder: SortOrder) => void
  title: string
}) {
  const {
    index,
    initialValueTemplates,
    menuItems: menuItemsProp,
    menuItemGroups,
    setLayout,
    setSortOrder,
    title,
  } = props
  const {features} = useDeskTool()
  const {collapsed, rootElement} = usePane()
  const {BackLink} = usePaneRouter()

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

  const actionItems = useMemo(() => {
    return (
      menuItemsProp?.filter(
        (item) =>
          item.showAsAction &&
          (!collapsed || (typeof item.showAsAction === 'object' && item.showAsAction.whenCollapsed))
      ) || []
    )
  }, [collapsed, menuItemsProp])

  const menuItems = useMemo(() => {
    return menuItemsProp?.filter((item) => !item.showAsAction)
  }, [menuItemsProp])

  const contextMenu = useMemo(
    () =>
      menuItems && menuItems.length > 0 ? (
        <PaneContextMenuButton
          boundaryElement={rootElement}
          items={menuItems}
          itemGroups={menuItemGroups}
          key="$contextMenu"
          onAction={handleAction}
        />
      ) : null,
    [handleAction, menuItems, menuItemGroups, rootElement]
  )

  const actions = useMemo(() => {
    const actionNodes: React.ReactNode[] = actionItems.map((action, actionIndex) => {
      if (action.intent) {
        return (
          <IntentActionButton
            intent={action.intent}
            item={action}
            key={action.key || actionIndex}
          />
        )
      }

      const createMenuItems: MenuItemType[] = initialValueTemplates
        ? (S.menuItemsFromInitialValueTemplateItems(initialValueTemplates) as any)
        : []

      return (
        <BoundaryElementProvider element={rootElement} key={action.key || actionIndex}>
          <CreateMenuButton items={createMenuItems} />
        </BoundaryElementProvider>
      )
    })

    return <Inline space={1}>{actionNodes.concat([contextMenu])}</Inline>
  }, [actionItems, contextMenu, initialValueTemplates, rootElement])

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
