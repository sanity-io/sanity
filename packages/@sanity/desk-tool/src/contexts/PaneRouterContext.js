import React from 'react'
import {StateLink} from 'part:@sanity/base/router'

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

  // Curried StateLink that passes the correct state automatically
  ChildLink: ({childId, childParameters, ...props}) => missingContext(),

  // Get the current pane ID and parameters
  getCurrentPane: missingContext,

  // Replaces the current pane with a new one
  replaceCurrentPane: (itemId, params) => missingContext(),

  // Removes the current pane from the group
  closeCurrentPane: () => missingContext(),

  // Replace or create a child pane with the given id and parameters
  replaceChildPane: (itemId, params) => missingContext(),

  // Duplicate the current pane, with optional overrides for item ID and parameters
  duplicateCurrentPane: (itemId, params) => missingContext(),

  // Set the current "view" for the pane
  setPaneView: viewId => missingContext(),

  // Returns the payload for the current pane
  getPanePayload: () => missingContext(),

  // Returns the parameters for the current pane
  getPaneParameters: () => missingContext(),

  // Returns the current view (from the parameters) for the current pane
  getPaneView: () => missingContext(),

  // Proxied navigation to a given intent. Consider just exposing `router` instead?
  navigateIntent: (intentName, params, options = {}) => missingContext()
})

export function getPaneRouterContextFactory(instance) {
  if (!instance.PaneRouterContexts) {
    instance.PaneRouterContexts = new Map()
  }

  return ({groupIndex, siblingIndex, flatIndex}) => {
    const key = `${flatIndex}-${groupIndex}[${siblingIndex}]`
    if (instance.PaneRouterContexts.has(key)) {
      return instance.PaneRouterContexts.get(key)
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

    const getRouterPane = () => {
      const {panes} = instance.props.router.state
      const routerPanes = panes || []
      const group = routerPanes[groupIndex] || []
      return group[siblingIndex] || {}
    }

    const ctx = {
      // Zero-based index (position) of pane, visually
      index: flatIndex,

      // Zero-based index of pane group (within URL structure)
      groupIndex,

      // Zero-based index of pane within sibling group
      siblingIndex,

      // Curried StateLink that passes the correct state automatically
      // eslint-disable-next-line react/prop-types
      ChildLink: function ChildLink({childId, childPayload, ...props}) {
        const oldPanes = instance.props.router.state.panes || []
        const panes = oldPanes
          .slice(0, groupIndex + 1)
          .concat([[{id: childId, payload: childPayload}]])

        return <StateLink {...props} state={{panes}} />
      },

      // Get the current pane ID and parameters
      getCurrentPane: () => {
        const routerGroups = instance.props.router.state.panes || []
        const routerGroup = routerGroups[groupIndex]
        const routerPane = routerGroup && routerGroup[siblingIndex]
        const childGroup = routerGroups[groupIndex + 1] || []

        return {
          pane: instance.props.panes[flatIndex],
          router: routerPane,
          child: childGroup[0],
          siblings: routerGroup
        }
      },

      // Replaces the current pane with a new one
      replaceCurrentPane: (itemId, payload) => {
        modifyCurrentGroup(() => [{id: itemId, payload}])
      },

      // Removes the current pane from the group
      closeCurrentPane: () => {
        modifyCurrentGroup((siblings, item) =>
          siblings.length > 1 ? siblings.filter(sibling => sibling !== item) : siblings
        )
      },

      // Replace or create a child pane with the given id and parameters
      replaceChildPane: (itemId, payload) => {
        const {router} = instance.props
        const {panes} = router.state
        const newPanes = panes.slice()
        newPanes.splice(groupIndex + 1, 1, [{id: itemId, payload}])
        router.navigate({...router.state, panes: newPanes})
      },

      // Duplicate the current pane, with optional overrides for item ID and parameters
      duplicateCurrentPane: (itemId, payload, params) => {
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

      setPaneView: viewId => {
        modifyCurrentGroup((siblings, item) => {
          const newGroup = siblings.slice()
          const newItem = {...item, params: viewId ? {view: viewId} : {}}
          newGroup.splice(siblingIndex, 1, newItem)
          return newGroup
        })
      },

      getPaneParameters: () => getRouterPane().params || {},
      getPanePayload: () => getRouterPane().payload,
      getPaneView: () => (getRouterPane().params || {}).view,

      // Proxied navigation to a given intent. Consider just exposing `router` instead?
      navigateIntent: instance.props.router.navigateIntent
    }

    instance.PaneRouterContexts.set(key, ctx)
    return ctx
  }
}
