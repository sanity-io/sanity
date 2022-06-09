import {UnknownIcon} from '@sanity/icons'
import {Box, Button, Inline, Text, Tooltip} from '@sanity/ui'
import {partition, uniqBy} from 'lodash'
import React, {memo, useCallback, useMemo} from 'react'
import {useTemplates} from '../../../hooks'
import {InitialValueTemplateItem} from '../../../templates'
import {DeskToolPaneActionHandler, PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {IntentButton} from '../IntentButton'
import {PaneContextMenuButton} from '../pane/PaneContextMenuButton'
import {PaneHeaderCreateButton} from './PaneHeaderCreateButton'

// to preserve memory references
const emptyArray: never[] = []
const emptyObject = {}

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

export const PaneHeaderActions = memo(
  ({
    initialValueTemplateItems: initialValueTemplateItemsFromStructure = emptyArray,
    menuItems = emptyArray,
    menuItemGroups = emptyArray,
    actionHandlers = emptyObject,
  }: PaneHeaderActionsProps) => {
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
      [actionHandlers]
    )

    const [actionMenuItems, contextMenuItems] = useMemo(() => {
      const nonCreateMenuItem = menuItems
        // remove items with `create` intents because those will get combined
        // into one action button later
        .filter((item) => item.intent?.type !== 'create')

      return partition(nonCreateMenuItem, (item) => item.showAsAction)
    }, [menuItems])

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
        (item) => hashObject([item.initialDocumentId, item.templateId, item.parameters])
      )
    }, [initialValueTemplateItemFromMenuItems, initialValueTemplateItemsFromStructure])

    return (
      <Inline space={1}>
        {[
          Boolean(combinedInitialValueTemplates.length) && (
            <PaneHeaderCreateButton
              key="$CreateMenuButton"
              templateItems={combinedInitialValueTemplates}
            />
          ),
          //
          ...actionMenuItems.map((actionItem, actionIndex) => {
            return (
              <Tooltip
                content={
                  <Box padding={2}>
                    <Text size={1}>{actionItem.title}</Text>
                  </Box>
                }
                // eslint-disable-next-line react/no-array-index-key
                key={`${actionIndex}-${actionItem.title}`}
                placement="bottom"
              >
                {actionItem.intent ? (
                  <IntentButton
                    intent={actionItem.intent}
                    aria-label={actionItem.title}
                    icon={actionItem.icon || UnknownIcon}
                    mode="bleed"
                  />
                ) : (
                  <Button
                    aria-label={actionItem.title}
                    icon={actionItem.icon || UnknownIcon}
                    mode="bleed"
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => handleAction(actionItem)}
                  />
                )}
              </Tooltip>
            )
          }),
          //
          Boolean(contextMenuItems.length) && (
            <PaneContextMenuButton
              items={contextMenuItems}
              itemGroups={menuItemGroups}
              key="$ContextMenu"
              onAction={handleAction}
            />
          ),
        ]}
      </Inline>
    )
  }
)

PaneHeaderActions.displayName = 'PaneHeaderActions'
