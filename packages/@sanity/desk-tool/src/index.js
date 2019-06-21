import React from 'react'
import Icon from 'part:@sanity/base/view-column-icon'
import {route} from 'part:@sanity/base/router'
import DeskTool from './DeskTool'
import {parsePanesSegment} from './utils/parsePanesSegment'
import UUID from '@sanity/uuid'

function maybeRemapStringSegment(segment) {
  return typeof segment === 'string' ? {id: segment} : segment
}

function encodeSegment({id, params}) {
  const parts = params ? [id, JSON.stringify(params)] : [id]
  return parts.join(',')
}

function toState(pathSegment) {
  return parsePanesSegment(decodeURIComponent(pathSegment))
}

function toPath(panes) {
  return panes
    .map(maybeRemapStringSegment)
    .map(encodeSegment)
    .map(encodeURIComponent)
    .join(';')
}

const state = {activePanes: []}

function setActivePanes(panes) {
  state.activePanes = panes
}

function DeskToolPaneStateSyncer(props) {
  return <DeskTool {...props} onPaneChange={setActivePanes} />
}

function getIntentState(intentName, params, currentState) {
  const paneSegments = (currentState && currentState.panes) || []
  const activePanes = state.activePanes || []
  const editDocumentId = params.id || UUID()
  const isTemplate = intentName === 'create' && params.template

  // Loop through open panes and see if any of them can handle the intent
  for (let i = activePanes.length - 1; i >= 0; i--) {
    const pane = activePanes[i]
    if (pane.canHandleIntent && pane.canHandleIntent(intentName, params)) {
      const paneParams = isTemplate ? {template: params.template} : undefined
      return {panes: paneSegments.slice(0, i).concat({id: editDocumentId, params: paneParams})}
    }
  }

  return getFallbackIntentState({documentId: editDocumentId, intentName, params})
}

function getFallbackIntentState({documentId, intentName, params}) {
  const editDocumentId = documentId
  const isTemplateCreate = intentName === 'create' && params.template

  return isTemplateCreate
    ? {editDocumentId, template: params.template}
    : {editDocumentId, type: params.type || '*'}
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
    return (
      (intentName === 'edit' && params.id) ||
      (intentName === 'create' && params.type) ||
      (intentName === 'create' && params.template)
    )
  },
  getIntentState,
  title: 'Desk',
  name: 'desk',
  icon: Icon,
  component: DeskToolPaneStateSyncer
}
