import React from 'react'
import UUID from '@sanity/uuid'
import {getTemplateById} from '@sanity/base/initial-value-templates'
import Icon from 'part:@sanity/base/view-column-icon'
import {route} from 'part:@sanity/base/router'
import {
  parseChunks,
  encodeChunks,
  parsePanesSegment,
  encodePanesSegment
} from './utils/parsePanesSegment'
import DeskTool from './DeskTool'

function toState(pathSegment) {
  return parsePanesSegment(decodeURIComponent(pathSegment))
}

function toPath(panes) {
  return encodePanesSegment(panes)
}

function optionsToState(optionsString) {
  const chunks = optionsString.split(',')
  return parseChunks(chunks)
}

function optionsToPath(options) {
  return encodeChunks(options)
}

const state = {activePanes: []}

function setActivePanes(panes) {
  state.activePanes = panes
}

function DeskToolPaneStateSyncer(props) {
  return <DeskTool {...props} onPaneChange={setActivePanes} />
}

// eslint-disable-next-line complexity
function getIntentState(intentName, params, currentState, payload) {
  const paneSegments = (currentState && currentState.panes) || []
  const activePanes = state.activePanes || []
  const editDocumentId = params.id || UUID()
  const isTemplate = intentName === 'create' && params.template

  // Loop through open panes and see if any of them can handle the intent
  for (let i = activePanes.length - 1; i >= 0; i--) {
    const pane = activePanes[i]
    if (pane.canHandleIntent && pane.canHandleIntent(intentName, params, {pane, index: i})) {
      const paneParams = isTemplate ? {template: params.template} : {}
      return {
        panes: paneSegments
          .slice(0, i)
          .concat([[{id: editDocumentId, params: paneParams, payload}]])
      }
    }
  }

  return getFallbackIntentState({documentId: editDocumentId, intentName, params, payload})
}

function getFallbackIntentState({documentId, intentName, params, payload}) {
  const isTemplateCreate = intentName === 'create' && params.template
  const template = isTemplateCreate && getTemplateById(params.template)
  const parameters = {
    id: documentId,
    template: params.template,
    type: (template && template.schemaType) || params.type
  }

  return {
    panes: [[{id: '__edit__', params: parameters, payload}]]
  }
}

export default {
  router: route('/', [
    // The regular path - when the intent can be resolved to a specific pane
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
