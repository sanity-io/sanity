import {Flex} from '@sanity/ui'
import {uniqBy} from 'lodash'
import React, {memo, useCallback, useMemo} from 'react'
import {isMenuNodeButton, isNotMenuNodeButton, resolveMenuNodes} from '../../menuNodes'
import {DeskToolPaneActionHandler, PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {PaneContextMenuButton} from '../pane/PaneContextMenuButton'
import {PaneHeaderActionButton} from '../pane/PaneHeaderActionButton'
import {PaneHeaderCreateButton} from './PaneHeaderCreateButton'
import {useTemplates, InitialValueTemplateItem, EMPTY_ARRAY, EMPTY_OBJECT} from 'sanity'

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

/**
 * hashes an object to a string where the order of the keys don't matter
 */
const hashObject = (value: unknown) => {
  const sortObject = (v: unknown): unknown => {
    if (typeof v !== 'object' || !v) return v
    if (Array.isArray(v)) return v.map(sortObject)
    return Object.entries(v).sort(([keyA], [keyB]) => keyA.localeCompare(keyB, 'en'))
  }

  const normalize = (v: unknown) => JSON.parse(JSON.stringify(v))

  return JSON.stringify(sortObject(normalize(value)))
}

interface PaneHeaderActionsProps {
  initialValueTemplateItems?: InitialValueTemplateItem[]
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  actionHandlers?: Record<string, DeskToolPaneActionHandler>
}

export const PaneHeaderActions = memo(function PaneHeaderActions(props: PaneHeaderActionsProps) {
  const {
    initialValueTemplateItems: initialValueTemplateItemsFromStructure = EMPTY_ARRAY,
    menuItems = EMPTY_ARRAY,
    menuItemGroups = EMPTY_ARRAY,
    actionHandlers = EMPTY_OBJECT as Record<string, DeskToolPaneActionHandler>,
  } = props

  const templates = useTemplates()

  const handleAction = useCallback(
    (item: PaneMenuItem) => {
      if (typeof item.action === 'string' && !(item.action in actionHandlers)) {
        console.warn('No handler for action:', item.action)
        return false
      }

      const handler =
        // eslint-disable-next-line no-nested-ternary
        typeof item.action === 'function'
          ? item.action
          : typeof item.action === 'string'
          ? actionHandlers[item.action]
          : null

      if (handler) {
        handler(item.params as Record<string, string>)
        return true
      }

      return false
    },
    [actionHandlers],
  )

  const menuNodes = useMemo(
    () =>
      resolveMenuNodes({
        actionHandler: handleAction,
        menuItemGroups,
        menuItems: menuItems
          // remove items with `create` intents because those will get combined
          // into one action button (see `initialValueTemplateItemFromMenuItems`)
          .filter((item) => item.intent?.type !== 'create'),
      }),
    [handleAction, menuItemGroups, menuItems],
  )

  const actionNodes = useMemo(() => menuNodes.filter(isMenuNodeButton), [menuNodes])
  const contextMenuNodes = useMemo(() => menuNodes.filter(isNotMenuNodeButton), [menuNodes])

  const initialValueTemplateItemFromMenuItems = useMemo(() => {
    return menuItems
      .map((item, menuItemIndex) => {
        if (item.intent?.type !== 'create') return null

        const {params} = item.intent
        if (!params) return null

        const intentParams = Array.isArray(params) ? params[0] : params
        const templateParams = Array.isArray(params) ? params[1] : undefined

        // fallback to the schema type name as the template ID.
        // by default, the initial template values are populated from every
        // document type in the schema
        const templateId = intentParams.template || intentParams.type
        if (!templateId) return null

        // eslint-disable-next-line max-nested-callbacks
        const template = templates.find((t) => t.id === templateId)
        // the template doesn't exist then the action might be disabled
        if (!template) return null

        const initialDocumentId = intentParams.id

        return {
          item,
          template,
          templateParams,
          menuItemIndex,
          initialDocumentId,
        }
      })
      .filter(isNonNullable)
      .map(({initialDocumentId, item, template, menuItemIndex, templateParams}) => {
        const initialValueTemplateItem: InitialValueTemplateItem = {
          id: `menuItem${menuItemIndex}`,
          initialDocumentId,
          templateId: template.id,
          type: 'initialValueTemplateItem',
          title: item.title || template.title,
          icon: item.icon as InitialValueTemplateItem['icon'],
          description: template.description,
          parameters: templateParams,
          schemaType: template.schemaType,
        }

        return initialValueTemplateItem
      })
  }, [menuItems, templates])

  const combinedInitialValueTemplates = useMemo(() => {
    // this de-dupes create actions
    return uniqBy(
      [...initialValueTemplateItemFromMenuItems, ...initialValueTemplateItemsFromStructure],
      (item) => hashObject([item.initialDocumentId, item.templateId, item.parameters]),
    )
  }, [initialValueTemplateItemFromMenuItems, initialValueTemplateItemsFromStructure])

  return (
    <Flex gap={1}>
      {combinedInitialValueTemplates.length > 0 && (
        <PaneHeaderCreateButton templateItems={combinedInitialValueTemplates} />
      )}

      {actionNodes.map((node) => (
        <PaneHeaderActionButton key={node.key} node={node} />
      ))}

      {contextMenuNodes.length > 0 && <PaneContextMenuButton nodes={contextMenuNodes} />}
    </Flex>
  )
})
