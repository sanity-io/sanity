import React from 'react'

export const LOADING_PANE = Symbol('LOADING_PANE')

const missingContext = () => {
  throw new Error('Pane is missing router context')
}

export const PaneRouterContext = React.createContext({
  // Zero-based index (position) of pane
  index: 0,

  // Zero-based index of pane within sibling group
  groupIndex: 0,

  // Returns the current router state for the whole desk tool
  getCurrentRouterState: missingContext,

  // Curried StateLink that passes the correct state automatically
  ChildLink: ({childId, childParameters, ...props}) => missingContext(),

  // Get the current pane ID and parameters
  getCurrentPane: missingContext,

  // Replaces the current pane with a new one
  replaceCurrentPane: (itemId, params) => missingContext(),

  // Replace or create a child pane with the given id and parameters
  replaceChildPane: (itemId, params) => missingContext(),

  // Duplicate the current pane, with optional overrides for item ID and parameters
  duplicateCurrentPane: (itemId, params) => missingContext(),

  // Set the current "view" for the pane
  setPaneView: viewId => missingContext(),

  // Proxied navigation to a given intent. Consider just exposing `router` instead?
  navigateIntent: (intentName, params, options = {}) => missingContext()
})
