import {SchemaType} from '@sanity/types'
import {ArrowLeftIcon, UnknownIcon} from '@sanity/icons'
import {InitialValueTemplateItem, StructureBuilder as S} from '@sanity/structure'
import {Box, Button, Inline, Text, Tooltip} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import React, {useCallback, useMemo} from 'react'
import {combineLatest, of} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {filter, map, switchMap} from 'rxjs/operators'
import {canCreate} from '@sanity/base/_internal'
import {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {IntentButton} from '../../components/IntentButton'
import {PaneContextMenuButton, PaneHeader, usePane} from '../../components/pane'
import {useDeskTool} from '../../contexts/deskTool'
import {BackLink} from '../../contexts/paneRouter'
import {DeskToolPaneActionHandler} from '../../types/types'
import {useDeskToolPaneActions} from '../useDeskToolPaneActions'
import {getInitialValueObservable} from '../document/initialValue/getInitialValue'
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
function isDefaultCreateActionItem(actionItem: PaneMenuItem, schemaType: SchemaType | null) {
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
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
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
    (item: PaneMenuItem) => {
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

  const createMenuItems: PaneMenuItem[] = useMemo(
    () =>
      initialValueTemplates
        ? (S.menuItemsFromInitialValueTemplateItems(initialValueTemplates) as any)
        : [],
    [initialValueTemplates]
  )

  const {actionItems, menuItems} = useDeskToolPaneActions({
    collapsed,
    menuItems: menuItemsProp,
  })

  const contextMenu = useMemo(
    () =>
      menuItems.length ? (
        <PaneContextMenuButton
          items={menuItems}
          itemGroups={menuItemGroups}
          key="$ContextMenu"
          onAction={handleAction}
        />
      ) : null,
    [handleAction, menuItems, menuItemGroups]
  )

  const createMenuItemPermissions = useMemoObservable(
    () => resolveInitialValuesFromTemplates(initialValueTemplates),
    [initialValueTemplates]
  )

  const actions = useMemo(() => {
    let foundCreateButton = false

    const actionNodes = actionItems.map((action, actionIndex) => {
      // Replace the "Create" button when there are multiple initial value resolvedTemplates
      if (createMenuItems.length > 1 && isDefaultCreateActionItem(action, schemaType)) {
        foundCreateButton = true
        return (
          <CreateMenuButton
            permissions={createMenuItemPermissions || []}
            items={createMenuItems}
            key={action.key || actionIndex}
          />
        )
      }

      if (action.intent) {
        // when it's single action
        const permission = createMenuItemPermissions || []
        const granted = permission.length > 0 ? permission[0].granted : true
        const reason = permission.length > 0 ? permission[0].reason : ''

        return (
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>{granted ? action.title : reason}</Text>
              </Box>
            }
            disabled={!action.title}
            key={action.key || actionIndex}
            placement="bottom"
          >
            <div>
              <IntentButton
                data-testid="action-intent-button"
                disabled={!granted}
                aria-label={String(action.title)}
                icon={action.icon || UnknownIcon}
                intent={action.intent}
                key={action.key || actionIndex}
                mode="bleed"
              />
            </div>
          </Tooltip>
        )
      }

      return null
    })

    const createMenuButton =
      foundCreateButton || createMenuItems.length <= 1 ? null : (
        <CreateMenuButton
          permissions={createMenuItemPermissions || []}
          items={createMenuItems}
          key="$CreateMenuButton"
        />
      )

    return <Inline space={1}>{[...actionNodes, createMenuButton, contextMenu]}</Inline>
  }, [actionItems, createMenuItems, createMenuItemPermissions, contextMenu, schemaType])

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

function resolveInitialValuesFromTemplates(initialValueTemplates?: InitialValueTemplateItem[]) {
  if (!initialValueTemplates) {
    return of([])
  }
  return combineLatest(
    initialValueTemplates.map((template) =>
      getInitialValueObservable({
        documentId: 'dummyId',
        paneOptions: {
          template: template.templateId,
          templateParameters: template.parameters,
          id: template.templateId,
          type: template.type,
        },
      }).pipe(
        filter((state) => state.type === 'success'),
        map((state: any) => state.value as {_id?: string; _type: string}),
        switchMap((document) => canCreate({_id: 'dummy', ...document}))
      )
    )
  )
}
