import React from 'react'
import {isEqual} from 'lodash'
import {StateLink} from 'part:@sanity/base/router'

const contextCache = new WeakMap()

const missingContext = () => {
  throw new Error('Pane is missing router context')
}

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

  // Curried StateLink that passes the correct state automatically
  ChildLink: ({childId, childParameters, ...props}) => missingContext(),

  // Replaces the current pane with a new one
  replaceCurrent: (itemId, params) => missingContext(),

  // Removes the current pane from the group
  closeCurrent: () => missingContext(),

  // Replace or create a child pane with the given id and parameters
  replaceChild: (itemId, params) => missingContext(),

  // Duplicate the current pane, with optional overrides for item ID and parameters
  duplicateCurrent: (itemId, params) => missingContext(),

  // Set the current "view" for the pane
  setView: viewId => missingContext(),

  // Proxied navigation to a given intent. Consider just exposing `router` instead?
  navigateIntent: (intentName, params, options = {}) => missingContext()
})

export function getPaneRouterContextFactory(instance) {
  let contexts = contextCache.get(instance)
  if (!contexts) {
    contexts = new Map()
    contextCache.set(instance, contexts)
  }

  return ({groupIndex, siblingIndex, flatIndex}) => {
    const getRouterPane = () => {
      const {panes} = instance.props.router.state
      const routerPanes = panes || []
      const group = routerPanes[groupIndex] || []
      return group[siblingIndex] || {}
    }

    const key = `${flatIndex}-${groupIndex}[${siblingIndex}]`
    if (contexts.has(key)) {
      const existing = contexts.get(key)
      const payloadEqual = isEqual(existing.payload, getRouterPane().payload)
      const paramsEqual = existing.params === getRouterPane().params
      if (paramsEqual && payloadEqual) {
        return existing
      }
    }

    const modifyCurrentGroup = modifier => {
      const {router} = instance.props
      const newPanes = (router.state.panes || []).slice()
      const group = newPanes[groupIndex].slice()
      newPanes.splice(groupIndex, 1, modifier(group, group[siblingIndex]))

      const newRouterState = {...router.state, panes: newPanes}
      router.navigate(newRouterState)
      return newRouterState
    }

    const {payload: currentPayload, params: currentParams} = getRouterPane()

    const ctx = {
      // Zero-based index (position) of pane, visually
      index: flatIndex,

      // Zero-based index of pane group (within URL structure)
      groupIndex,

      // Zero-based index of pane within sibling group
      siblingIndex,

      // Payload of the current pane
      payload: currentPayload,

      // Params of the current pane
      params: currentParams,

      // Curried StateLink that passes the correct state automatically
      // eslint-disable-next-line react/prop-types
      ChildLink: function ChildLink({childId, childPayload, ...props}) {
        const oldPanes = instance.props.router.state.panes || []
        const panes = oldPanes
          .slice(0, groupIndex + 1)
          .concat([[{id: childId, payload: childPayload}]])

        return <StateLink {...props} state={{panes}} />
      },

      // Replaces the current pane with a new one
      replaceCurrent: (itemId, payload, params) => {
        modifyCurrentGroup(() => [{id: itemId, payload, params}])
      },

      // Removes the current pane from the group
      closeCurrent: () => {
        modifyCurrentGroup((siblings, item) =>
          siblings.length > 1 ? siblings.filter(sibling => sibling !== item) : siblings
        )
      },

      // Replace or create a child pane with the given id and parameters
      replaceChild: (itemId, payload) => {
        const {router} = instance.props
        const {panes} = router.state
        const newPanes = panes.slice()
        newPanes.splice(groupIndex + 1, 1, [{id: itemId, payload}])
        router.navigate({...router.state, panes: newPanes})
      },

      // Duplicate the current pane, with optional overrides for item ID and parameters
      duplicateCurrent: (itemId, payload, params) => {
        modifyCurrentGroup((siblings, item) => {
          const newGroup = siblings.slice()
          newGroup.splice(siblingIndex + 1, 0, {
            ...item,
            id: itemId || item.id,
            payload: payload || item.payload,
            params: params || item.params
          })
          return newGroup
        })
      },

      // Set the view for the current pane
      setView: viewId => {
        modifyCurrentGroup((siblings, item) => {
          const newGroup = siblings.slice()
          const {view: oldView, ...params} = item.params || {}
          const newItem = {...item, params: viewId ? {...params, view: viewId} : params}
          newGroup.splice(siblingIndex, 1, newItem)
          return newGroup
        })
      },

      // Proxied navigation to a given intent. Consider just exposing `router` instead?
      navigateIntent: instance.props.router.navigateIntent
    }

    contexts.set(key, ctx)
    return ctx
  }
}
