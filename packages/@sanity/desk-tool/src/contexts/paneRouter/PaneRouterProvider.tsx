import {useRouter, useRouterState} from '@sanity/base/router'
import {pick, omit, isEqual} from 'lodash'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {RouterPaneGroup, RouterPaneSibling} from '../../types'
import {ChildLink} from './ChildLink'
import {PaneRouterContext} from './PaneRouterContext'
import {ParameterizedLink} from './ParameterizedLink'
import {PaneRouterContextValue, SetParamsOptions} from './types'

const emptyArray: never[] = []

const DEFAULT_SET_PARAMS_OPTIONS: SetParamsOptions = {
  recurseIfInherited: false,
}

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
  const {children, flatIndex, index, params: paramsProp, payload: payloadProp, siblingIndex} = props
  const {navigate, navigateIntent} = useRouter()
  const routerState = useRouterState()
  const routerPaneGroups: RouterPaneGroup[] = useMemo(() => routerState?.panes || emptyArray, [
    routerState?.panes,
  ])

  const groupIndex = index - 1

  const [params, _setParams] = useState(paramsProp)
  const paramsRef = useRef(paramsProp)

  const [payload, _setPayload] = useState(payloadProp)
  const payloadRef = useRef(payloadProp)

  // Update params state
  useEffect(() => {
    if (!isEqual(paramsRef.current, paramsProp)) {
      paramsRef.current = paramsProp
      _setParams(paramsProp)
    }
  }, [paramsProp])

  // Update payload state
  useEffect(() => {
    if (!isEqual(payloadRef.current, payloadProp)) {
      payloadRef.current = payloadProp
      _setPayload(payloadProp)
    }
  }, [payloadProp])

  const modifyCurrentGroup = useCallback(
    (modifier: (siblings: RouterPaneGroup, item: RouterPaneSibling) => RouterPaneGroup) => {
      const newPanes = routerPaneGroups.slice(0)

      const currentGroup = routerPaneGroups[groupIndex] ? routerPaneGroups[groupIndex].slice(0) : []

      newPanes.splice(groupIndex, 1, modifier(currentGroup, currentGroup[siblingIndex]))

      const newRouterState = {...(routerState || {}), panes: newPanes}

      setTimeout(() => navigate(newRouterState), 0)

      return newRouterState
    },
    [groupIndex, navigate, routerPaneGroups, routerState, siblingIndex]
  )

  const setPayload: PaneRouterContextValue['setPayload'] = useCallback(
    (nextPayload) => {
      const currPayload = payloadRef.current

      if (!isEqual(currPayload, nextPayload)) {
        _setPayload(nextPayload)
        payloadRef.current = nextPayload
      }

      modifyCurrentGroup((siblings, item) => {
        const newGroup = siblings.slice()

        newGroup[siblingIndex] = {...item, payload: nextPayload}

        return newGroup
      })
    },
    [modifyCurrentGroup, siblingIndex]
  )

  const setParams: PaneRouterContextValue['setParams'] = useCallback(
    (nextParams, setOptions = {}) => {
      const currParams = paramsRef.current

      if (!isEqual(currParams, nextParams)) {
        _setParams(nextParams)
        paramsRef.current = nextParams
      }

      const {recurseIfInherited} = {...DEFAULT_SET_PARAMS_OPTIONS, ...setOptions}

      modifyCurrentGroup((siblings, item) => {
        const isGroupRoot = siblingIndex === 0
        const isDuplicate = !isGroupRoot && item.id === siblings[0].id
        const newGroup = siblings.slice()

        if (!isDuplicate) {
          newGroup[siblingIndex] = {...item, params: nextParams}
          return newGroup
        }

        const rootParams = siblings[0].params

        if (recurseIfInherited) {
          const newParamKeys = Object.keys(nextParams)
          const inheritedKeys = Object.keys(paramsProp).filter(
            (key) => rootParams && rootParams[key] === paramsProp[key]
          )

          const removedInheritedKeys = inheritedKeys.filter((key) => !nextParams[key])
          const remainingInheritedKeys = newParamKeys.filter((key) => inheritedKeys.includes(key))
          const exclusiveKeys = newParamKeys.filter((key) => !inheritedKeys.includes(key))
          const exclusive = pick(nextParams, exclusiveKeys)
          const inherited = {
            ...omit(rootParams, removedInheritedKeys),
            ...pick(nextParams, remainingInheritedKeys),
          }

          newGroup[0] = {...item, params: inherited}
          newGroup[siblingIndex] = {...item, params: exclusive}
        } else {
          // If it's a duplicate of the group root, we should only set the parameters
          // that differ from the group root.
          const newParams = Object.keys(nextParams).reduce<Record<string, string | undefined>>(
            (siblingParams, key) => {
              if (rootParams && nextParams[key] !== rootParams[key]) {
                siblingParams[key] = nextParams[key]
              }

              return siblingParams
            },
            {}
          )

          newGroup[siblingIndex] = {...item, params: newParams}
        }

        return newGroup
      })
    },
    [modifyCurrentGroup, paramsProp, siblingIndex]
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
        // const {payload, params} = options || {}
        modifyCurrentGroup((siblings, item) => {
          const newGroup = siblings.slice()
          newGroup.splice(siblingIndex + 1, 0, {
            ...item,
            payload: options?.payload || item.payload,
            params: options?.params || item.params,
          })
          return newGroup
        })
      },

      // Set the view for the current pane
      setView: (viewId) => {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          view, // omit
          ...restParams
        } = paramsRef.current

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
