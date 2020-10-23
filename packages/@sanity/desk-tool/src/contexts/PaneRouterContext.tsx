/* eslint-disable react/prop-types, react/no-multi-comp */
import React, {useContext} from 'react'
import {isEqual, pick, omit} from 'lodash'
import {StateLink, Router} from 'part:@sanity/base/router'

const contextCache = new WeakMap<object, Map<string, PaneRouterContextShape>>()

interface SetParamsOptions {
  recurseIfInherited?: boolean
}

const DEFAULT_SET_PARAMS_OPTIONS: SetParamsOptions = {
  recurseIfInherited: false,
}

function missingContext<T = any>(): T {
  throw new Error('Pane is missing router context')
}

export const exclusiveParams = ['view', 'since', 'rev']

type PaneSegment = {id: string; payload?: unknown; params?: Record<string, any>}
type RouterPanesState = Array<PaneSegment[]>

export interface PaneRouterContextShape {
  // Zero-based index (position) of pane, visually
  index: number

  // Zero-based index of pane group (within URL structure)
  groupIndex: number

  // Zero-based index of pane within sibling group
  siblingIndex: number

  // Payload of the current pane
  payload?: unknown

  // Params of the current pane
  params: Record<string, string>

  // Whether or not the pane has any siblings (within the same group)
  hasGroupSiblings: boolean

  // The length of the current group
  groupLength: number

  // Current router state for the "panes" property
  routerPanesState: RouterPanesState

  // Curried StateLink that passes the correct state automatically
  ChildLink: (props: {childId: string; childParameters: Record<string, any>}) => React.ReactNode

  // Curried StateLink that passed the correct state, but merges params/payload
  ParameterizedLink: (props: {params?: Record<string, any>; payload?: unknown}) => React.ReactNode

  // Replaces the current pane with a new one
  replaceCurrent: (pane: {id?: string; payload?: unknown; params?: Record<string, any>}) => void

  // Removes the current pane from the group
  closeCurrent: () => void

  // Duplicate the current pane, with optional overrides for item ID and parameters
  duplicateCurrent: (pane?: {payload?: unknown; params?: Record<string, any>}) => void

  // Set the current "view" for the pane
  setView: (viewId: string) => void

  // Set the parameters for the current pane
  setParams: (params: Record<string, any>, options?: SetParamsOptions) => void

  // Set the payload for the current pane
  setPayload: (payload: unknown) => void

  // Proxied navigation to a given intent. Consider just exposing `router` instead?
  navigateIntent: (
    intentName: string,
    params: Record<string, any>,
    options?: {replace?: boolean}
  ) => void
}

export const PaneRouterContext = React.createContext<PaneRouterContextShape>({
  index: 0,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 0,
  routerPanesState: [],
  ChildLink: () => missingContext(),
  ParameterizedLink: () => missingContext(),
  replaceCurrent: () => missingContext(),
  closeCurrent: () => missingContext(),
  duplicateCurrent: () => missingContext(),
  setView: () => missingContext(),
  setParams: () => missingContext(),
  setPayload: () => missingContext(),
  navigateIntent: () => missingContext(),
})

type ChildLinkProps = {
  childId: string
  childPayload?: unknown
  children?: React.ReactNode
}

const ChildLink = React.forwardRef(function ChildLink(props: ChildLinkProps, ref) {
  const {childId, childPayload, ...rest} = props
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)
  const panes: RouterPanesState = routerPanesState
    .slice(0, groupIndex + 1)
    .concat([[{id: childId, payload: childPayload}]])

  return <StateLink ref={ref} {...rest} state={{panes}} />
})

type ParameterizedLinkProps = {
  params?: Record<string, any>
  payload?: unknown
  children?: React.ReactNode
}

const ParameterizedLink = React.forwardRef(function ParameterizedLink(
  props: ParameterizedLinkProps,
  ref
) {
  const {params: newParams, payload: newPayload, ...rest} = props
  const {routerPanesState} = useContext(PaneRouterContext)

  const panes = routerPanesState.map((group, i) => {
    if (i !== routerPanesState.length - 1) {
      return group
    }

    const pane = group[0]
    return [
      {
        ...pane,
        params: newParams || pane.params,
        payload: newPayload || pane.payload,
      },
      ...group.slice(1),
    ]
  })

  return <StateLink ref={ref} {...rest} state={{panes}} />
})

type PaneRouterContextFactory = (options: {
  groupIndex: number
  siblingIndex: number
  flatIndex: number
  params: Record<string, any>
  payload: unknown
}) => PaneRouterContextShape

interface DeskToolPanesProps {
  router: Router // <{panes: RouterPanesState; payload: unknown; params: Record<string, any>}>
}

export function getPaneRouterContextFactory(
  instance: React.Component<DeskToolPanesProps>
): PaneRouterContextFactory {
  const exists = contextCache.has(instance)
  const contexts = contextCache.get(instance) || new Map<string, PaneRouterContextShape>()
  if (!exists) {
    contextCache.set(instance, contexts)
  }

  return ({
    groupIndex,
    siblingIndex,
    flatIndex,
    params: paneParams,
    payload: panePayload,
  }): PaneRouterContextShape => {
    const cacheKey = `${flatIndex}-${groupIndex}[${siblingIndex}]`
    const existing = contexts.get(cacheKey)
    if (existing) {
      const payloadEqual = isEqual(existing.payload, panePayload)
      const paramsEqual = isEqual(existing.params, paneParams)
      const panesEqual = isEqual(existing.routerPanesState, instance.props.router.state.panes)
      if (paramsEqual && payloadEqual && panesEqual) {
        return existing
      }
    }

    const getCurrentGroup = () => {
      const {router} = instance.props
      const panes = router.state.panes || []
      return (panes[groupIndex] || []).slice()
    }

    const modifyCurrentGroup = (modifier) => {
      const {router} = instance.props
      const newPanes = (router.state.panes || []).slice()
      const group = getCurrentGroup()
      newPanes.splice(groupIndex, 1, modifier(group, group[siblingIndex]))

      const newRouterState = {...router.state, panes: newPanes}
      router.navigate(newRouterState)
      return newRouterState
    }

    const setPayload: PaneRouterContextShape['setPayload'] = (payload) => {
      modifyCurrentGroup((siblings, item) => {
        const newGroup = siblings.slice()
        newGroup[siblingIndex] = {...item, payload}
        return newGroup
      })
    }

    const setParams: PaneRouterContextShape['setParams'] = (params, setOptions = {}) => {
      const {recurseIfInherited} = {...DEFAULT_SET_PARAMS_OPTIONS, ...setOptions}
      modifyCurrentGroup((siblings, item) => {
        const isGroupRoot = siblingIndex === 0
        const isDuplicate = !isGroupRoot && item.id === siblings[0].id
        const newGroup = siblings.slice()

        if (!isDuplicate) {
          newGroup[siblingIndex] = {...item, params}
          return newGroup
        }

        const rootParams = siblings[0].params
        if (recurseIfInherited) {
          const newParamKeys = Object.keys(params)
          const inheritedKeys = Object.keys(paneParams).filter(
            (key) => rootParams[key] === paneParams[key]
          )

          const removedInheritedKeys = inheritedKeys.filter((key) => !params[key])
          const remainingInheritedKeys = newParamKeys.filter((key) => inheritedKeys.includes(key))
          const exclusiveKeys = newParamKeys.filter((key) => !inheritedKeys.includes(key))
          const exclusive = pick(params, exclusiveKeys)
          const inherited = {
            ...omit(rootParams, removedInheritedKeys),
            ...pick(params, remainingInheritedKeys),
          }

          newGroup[0] = {...item, params: inherited}
          newGroup[siblingIndex] = {...item, params: exclusive}
        } else {
          // If it's a duplicate of the group root, we should only set the parameters
          // that differ from the group root.
          const newParams = Object.keys(params).reduce((siblingParams, key) => {
            if (exclusiveParams.includes(key) || params[key] !== rootParams[key]) {
              siblingParams[key] = params[key]
            }

            return siblingParams
          }, {})

          newGroup[siblingIndex] = {...item, params: newParams}
        }

        return newGroup
      })
    }

    const ctx: PaneRouterContextShape = {
      // Zero-based index (position) of pane, visually
      index: flatIndex,

      // Zero-based index of pane group (within URL structure)
      groupIndex,

      // Zero-based index of pane within sibling group
      siblingIndex,

      // Payload of the current pane
      payload: panePayload,

      // Params of the current pane
      params: paneParams,

      // Whether or not the pane has any siblings (within the same group)
      hasGroupSiblings: getCurrentGroup().length > 1,

      // The length of the current group
      groupLength: getCurrentGroup().length,

      // Current router state for the "panes" property
      routerPanesState: instance.props.router.state.panes || [],

      // Curried StateLink that passes the correct state automatically
      ChildLink,

      // Curried StateLink that passed the correct state, but merges params/payload
      ParameterizedLink,

      // Replaces the current pane with a new one
      replaceCurrent: ({id, payload, params} = {}): void => {
        modifyCurrentGroup(() => [{id, payload, params}])
      },

      // Removes the current pane from the group
      closeCurrent: (): void => {
        modifyCurrentGroup((siblings, item) =>
          siblings.length > 1 ? siblings.filter((sibling) => sibling !== item) : siblings
        )
      },

      // Duplicate the current pane, with optional overrides for payload, parameters
      duplicateCurrent: (options): void => {
        const {payload, params} = options || {}
        modifyCurrentGroup((siblings, item) => {
          const newGroup = siblings.slice()
          newGroup.splice(siblingIndex + 1, 0, {
            ...item,
            payload: payload || item.payload,
            params: params || item.params,
          })
          return newGroup
        })
      },

      // Set the view for the current pane
      setView: (viewId) => {
        const {view, ...rest} = paneParams
        return setParams(viewId ? {...rest, view: viewId} : rest)
      },

      // Set the parameters for the current pane
      setParams,

      // Set the payload for the current pane
      setPayload,

      // Proxied navigation to a given intent. Consider just exposing `router` instead?
      navigateIntent: instance.props.router.navigateIntent,
    }

    contexts.set(cacheKey, ctx)
    return ctx
  }
}

export function usePaneRouter(): PaneRouterContextShape {
  return React.useContext(PaneRouterContext)
}
