/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/prop-types */

import React, {useContext} from 'react'
import {isEqual, pick, omit} from 'lodash'
import {StateLink} from 'part:@sanity/base/router'

const contextCache = new WeakMap()

const DEFAULT_SET_PARAMS_OPTIONS = {
  recurseIfInherited: false
}

const missingContext = () => {
  throw new Error('Pane is missing router context')
}

export const exclusiveParams = ['view']

export const PaneRouterContext = React.createContext({
  // Zero-based index (position) of pane, visually
  index: 0,

  // Zero-based index of pane group (within URL structure)
  groupIndex: 0,

  // Zero-based index of pane within sibling group
  siblingIndex: 0,

  // Payload of the current pane
  payload: undefined,

  // Params of the current pane
  params: {},

  // Whether or not the pane has any siblings (within the same group)
  hasGroupSiblings: false,

  // Current router state for the "panes" property
  routerPanesState: [],

  // Curried StateLink that passes the correct state automatically
  ChildLink: ({childId, childParameters, ...props}) => missingContext(),

  // Curried StateLink that passed the correct state, but merges params/payload
  ParameterizedLink: ({params, payload, ...props}) => missingContext(),

  // Replaces the current pane with a new one
  replaceCurrent: ({id, payload, params} = {}) => missingContext(),

  // Removes the current pane from the group
  closeCurrent: () => missingContext(),

  // Duplicate the current pane, with optional overrides for item ID and parameters
  duplicateCurrent: ({payload, params} = {}) => missingContext(),

  // Set the current "view" for the pane
  setView: viewId => missingContext(),

  // Set the parameters for the current pane
  setParams: params => missingContext(),

  // Set the payload for the current pane
  setPayload: payload => missingContext(),

  // Proxied navigation to a given intent. Consider just exposing `router` instead?
  navigateIntent: (intentName, params, options = {}) => missingContext()
})

const ChildLink = React.forwardRef(function ChildLink({childId, childPayload, ...props}, ref) {
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)
  const panes = routerPanesState
    .slice(0, groupIndex + 1)
    .concat([[{id: childId, payload: childPayload}]])

  return <StateLink ref={ref} {...props} state={{panes}} />
})

const ParameterizedLink = React.forwardRef(function ParameterizedLink(
  {params: newParams, payload: newPayload, ...props},
  ref
) {
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
        payload: newPayload || pane.payload
      },
      ...group.slice(1)
    ]
  })

  return <StateLink ref={ref} {...props} state={{panes}} />
})

export function getPaneRouterContextFactory(instance) {
  let contexts = contextCache.get(instance)
  if (!contexts) {
    contexts = new Map()
    contextCache.set(instance, contexts)
  }

  return ({groupIndex, siblingIndex, flatIndex, params: paneParams, payload: panePayload}) => {
    const cacheKey = `${flatIndex}-${groupIndex}[${siblingIndex}]`
    if (contexts.has(cacheKey)) {
      const existing = contexts.get(cacheKey)
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

    const modifyCurrentGroup = modifier => {
      const {router} = instance.props
      const newPanes = (router.state.panes || []).slice()
      const group = getCurrentGroup()
      newPanes.splice(groupIndex, 1, modifier(group, group[siblingIndex]))

      const newRouterState = {...router.state, panes: newPanes}
      router.navigate(newRouterState)
      return newRouterState
    }

    const setPayload = payload => {
      modifyCurrentGroup((siblings, item) => {
        const newGroup = siblings.slice()
        newGroup[siblingIndex] = {...item, payload}
        return newGroup
      })
    }

    const setParams = (params, setOptions = {}) => {
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
            key => rootParams[key] === paneParams[key]
          )

          const removedInheritedKeys = inheritedKeys.filter(key => !params[key])
          const remainingInheritedKeys = newParamKeys.filter(key => inheritedKeys.includes(key))
          const exclusiveKeys = newParamKeys.filter(key => !inheritedKeys.includes(key))
          const exclusive = pick(params, exclusiveKeys)
          const inherited = {
            ...omit(rootParams, removedInheritedKeys),
            ...pick(params, remainingInheritedKeys)
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

    const ctx = {
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

      // Current router state for the "panes" property
      routerPanesState: instance.props.router.state.panes || [],

      // Curried StateLink that passes the correct state automatically
      ChildLink,

      // Curried StateLink that passed the correct state, but merges params/payload
      ParameterizedLink,

      // Replaces the current pane with a new one
      replaceCurrent: ({id, payload, params} = {}) => {
        modifyCurrentGroup(() => [{id, payload, params}])
      },

      // Removes the current pane from the group
      closeCurrent: () => {
        modifyCurrentGroup((siblings, item) =>
          siblings.length > 1 ? siblings.filter(sibling => sibling !== item) : siblings
        )
      },

      // Duplicate the current pane, with optional overrides for payload, parameters
      duplicateCurrent: ({payload, params} = {}) => {
        modifyCurrentGroup((siblings, item) => {
          const newGroup = siblings.slice()
          newGroup.splice(siblingIndex + 1, 0, {
            ...item,
            payload: payload || item.payload,
            params: params || item.params
          })
          return newGroup
        })
      },

      // Set the view for the current pane
      setView: viewId => {
        const {view, ...rest} = paneParams
        return setParams(viewId ? {...rest, view: viewId} : rest)
      },

      // Set the parameters for the current pane
      setParams,

      // Set the payload for the current pane
      setPayload,

      // Proxied navigation to a given intent. Consider just exposing `router` instead?
      navigateIntent: instance.props.router.navigateIntent
    }

    contexts.set(cacheKey, ctx)
    return ctx
  }
}
