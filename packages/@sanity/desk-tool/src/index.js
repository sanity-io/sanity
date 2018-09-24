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
  router: route('/', [
    route('/edit/:type/:editDocumentId'),
    route({
      path: '/:panes',
      // Legacy URLs, used to handle redirects
      children: [route('/:action', route('/:legacyEditDocumentId'))],
      transform: {
        panes: {toState, toPath}
      }
    })
  ]),
  canHandleIntent(intentName, params) {
    return (intentName === 'edit' && params.id) || (intentName === 'create' && params.type)
  },
  getIntentState(intentName, params, currentState) {
    const paneIds = (currentState && currentState.panes) || []
    const activePanes = state.activePanes || []
    const editDocumentId = params.id || UUID()

    // Loop through open panes and see if any of them can handle the intent
    for (let i = activePanes.length - 1; i >= 0; i--) {
      const pane = activePanes[i]
      if (pane.canHandleIntent && pane.canHandleIntent(intentName, params)) {
        return {panes: paneIds.slice(0, i).concat(editDocumentId)}
      }
    }

    return {editDocumentId, type: params.type || '*'}
  },
  title: 'Desk',
  name: 'desk',
  icon: Icon,
  component: DeskToolPaneStateSyncer
}
