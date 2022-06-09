import {omit} from 'lodash'
import React, {useCallback, useMemo} from 'react'
import {toString as pathToString} from '@sanity/util/paths'
import {RouterPaneGroup, RouterPanes, RouterPaneSibling} from '../../types'
import {useRouter, useRouterState} from '../../../router'
import {ChildLink} from './ChildLink'
import {BackLink} from './BackLink'
import {ReferenceChildLink} from './ReferenceChildLink'
import {PaneRouterContext} from './PaneRouterContext'
import {ParameterizedLink} from './ParameterizedLink'
import {PaneRouterContextValue} from './types'

const emptyArray: never[] = []

/**
 * @internal
 */
export function PaneRouterProvider(props: {
  children: React.ReactNode
  flatIndex: number
  index: number
  params: Record<string, string | undefined>
  payload: unknown
  siblingIndex: number
}) {
  const {children, flatIndex, index, params, payload, siblingIndex} = props
  const {navigate, navigateIntent} = useRouter()
  const routerState = useRouterState()
  const routerPaneGroups: RouterPaneGroup[] = useMemo(
    () => (routerState?.panes || emptyArray) as RouterPanes,
    [routerState?.panes]
  )

  const groupIndex = index - 1

  const modifyCurrentGroup = useCallback(
    (modifier: (siblings: RouterPaneGroup, item: RouterPaneSibling) => RouterPaneGroup) => {
      const currentGroup = routerPaneGroups[groupIndex] || []
      const currentItem = currentGroup[siblingIndex]
      const nextGroup = modifier(currentGroup, currentItem)
      const nextPanes = [
        ...routerPaneGroups.slice(0, groupIndex),
        nextGroup,
        ...routerPaneGroups.slice(groupIndex + 1),
      ]
      const nextRouterState = {...(routerState || {}), panes: nextPanes}

      setTimeout(() => navigate(nextRouterState), 0)

      return nextRouterState
    },
    [groupIndex, navigate, routerPaneGroups, routerState, siblingIndex]
  )

  const setPayload: PaneRouterContextValue['setPayload'] = useCallback(
    (nextPayload) => {
      modifyCurrentGroup((siblings, item) => [
        ...siblings.slice(0, siblingIndex),
        {...item, payload: nextPayload},
        ...siblings.slice(siblingIndex + 1),
      ])
    },
    [modifyCurrentGroup, siblingIndex]
  )

  const setParams: PaneRouterContextValue['setParams'] = useCallback(
    (nextParams) => {
      modifyCurrentGroup((siblings, item) => [
        ...siblings.slice(0, siblingIndex),
        {...item, params: nextParams},
        ...siblings.slice(siblingIndex + 1),
      ])
    },
    [modifyCurrentGroup, siblingIndex]
  )

  const handleEditReference: PaneRouterContextValue['handleEditReference'] = useCallback(
    ({id, parentRefPath, type, template}) => {
      navigate({
        panes: [
          ...routerPaneGroups.slice(0, groupIndex + 1),
          [
            {
              id,
              params: {template: template.id, parentRefPath: pathToString(parentRefPath), type},
              payload: template.params,
            },
          ],
        ],
      })
    },
    [groupIndex, navigate, routerPaneGroups]
  )

  const ctx: PaneRouterContextValue = useMemo(
    () => ({
      // Zero-based index (position) of pane, visually
      index: flatIndex,

      // Zero-based index of pane group (within URL structure)
      groupIndex,

      // Zero-based index of pane within sibling group
      siblingIndex,

      // Payload of the current pane
      payload,

      // Params of the current pane
      params,

      // Whether or not the pane has any siblings (within the same group)
      hasGroupSiblings: routerPaneGroups[groupIndex]
        ? routerPaneGroups[groupIndex].length > 1
        : false,

      // The length of the current group
      groupLength: routerPaneGroups[groupIndex] ? routerPaneGroups[groupIndex].length : 0,

      // Current router state for the "panes" property
      routerPanesState: routerPaneGroups,

      // Curried StateLink that passes the correct state automatically
      ChildLink,

      // Curried StateLink that pops off the last pane group
      BackLink,

      // A specialized `ChildLink` that takes in the needed props to open a
      // referenced document to the right
      ReferenceChildLink,

      // Similar to `ReferenceChildLink` expect without the wrapping component
      handleEditReference,

      // Curried StateLink that passed the correct state, but merges params/payload
      ParameterizedLink,

      // Replaces the current pane with a new one
      replaceCurrent: (opts = {}): void => {
        modifyCurrentGroup(() => [
          {id: opts.id || '', payload: opts.payload, params: opts.params || {}},
        ])
      },

      // Removes the current pane from the group
      closeCurrent: (): void => {
        modifyCurrentGroup((siblings, item) =>
          siblings.length > 1 ? siblings.filter((sibling) => sibling !== item) : siblings
        )
      },

      // Duplicate the current pane, with optional overrides for payload, parameters
      duplicateCurrent: (options): void => {
        modifyCurrentGroup((siblings, item) => {
          const duplicatedItem = {
            ...item,
            payload: options?.payload || item.payload,
            params: options?.params || item.params,
          }

          return [
            ...siblings.slice(0, siblingIndex),
            duplicatedItem,
            ...siblings.slice(siblingIndex),
          ]
        })
      },

      // Set the view for the current pane
      setView: (viewId) => {
        const restParams = omit(params, 'view')
        return setParams(viewId ? {...restParams, view: viewId} : restParams)
      },

      // Set the parameters for the current pane
      setParams,

      // Set the payload for the current pane
      setPayload,

      // Proxied navigation to a given intent. Consider just exposing `router` instead?
      navigateIntent,
    }),
    [
      flatIndex,
      groupIndex,
      handleEditReference,
      modifyCurrentGroup,
      navigateIntent,
      params,
      payload,
      routerPaneGroups,
      setParams,
      setPayload,
      siblingIndex,
    ]
  )

  return <PaneRouterContext.Provider value={ctx}>{children}</PaneRouterContext.Provider>
}
