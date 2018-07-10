import React from 'react'
import Icon from 'part:@sanity/base/view-column-icon'
import UUID from '@sanity/uuid'
import {route} from 'part:@sanity/base/router'
import DeskTool from './DeskTool'

function toState(pathSegment) {
  return (pathSegment || '').split(';').filter(Boolean)
}

function toPath(panes) {
  return panes.join(';')
}

const state = {activePanes: []}

function setActivePanes(panes) {
  state.activePanes = panes
}

function DeskToolPaneStateSyncer(props) {
  return <DeskTool {...props} onPaneChange={setActivePanes} />
}

export default {
  router: route('/:panes', {transform: {panes: {toState, toPath}}}),
  canHandleIntent(intentName, params, currentState) {
    return (intentName === 'edit' && params.id) || (intentName === 'create' && params.type)
  },
  getIntentState(intentName, params, currentState) {
    const paneIds = (currentState && currentState.panes) || []

    // Loop through open panes and see if any of them can handle the intent
    let resolvedPaneIds = null
    for (let i = state.activePanes.length - 1; !resolvedPaneIds && i >= 0; i--) {
      const pane = state.activePanes[i]
      if (pane.canHandleIntent && pane.canHandleIntent(intentName, params)) {
        resolvedPaneIds = paneIds.slice(0, i).concat(params.id || UUID())
      }
    }

    return resolvedPaneIds ? {panes: resolvedPaneIds} : {}
  },
  title: 'Desk',
  name: 'desk',
  icon: Icon,
  component: DeskToolPaneStateSyncer
}
