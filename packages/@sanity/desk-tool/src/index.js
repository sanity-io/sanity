import React from 'react'
import Icon from 'part:@sanity/base/view-column-icon'
import {route} from 'part:@sanity/base/router'
import DeskTool from './DeskTool'
import {parsePanesSegment} from './utils/parsePanesSegment'
import UUID from '@sanity/uuid'
import {getTemplateById} from '@sanity/base/initial-value-templates'

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

function paramsToState(params) {
  try {
    return JSON.parse(decodeURIComponent(params))
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to parse JSON parameters')
    return {}
  }
}

function paramsToPath(params) {
  return JSON.stringify(params)
}

const state = {activePanes: []}

function setActivePanes(panes) {
  state.activePanes = panes
}

function DeskToolPaneStateSyncer(props) {
  return <DeskTool {...props} onPaneChange={setActivePanes} />
}

function getIntentState(intentName, params, currentState, jsonParams = {}) {
  const paneSegments = (currentState && currentState.panes) || []
  const activePanes = state.activePanes || []
  const editDocumentId = params.id || UUID()
  const isTemplate = intentName === 'create' && params.template

  // Loop through open panes and see if any of them can handle the intent
  for (let i = activePanes.length - 1; i >= 0; i--) {
    const pane = activePanes[i]
    if (pane.canHandleIntent && pane.canHandleIntent(intentName, params, {pane})) {
      const paneParams = isTemplate ? {template: params.template, ...jsonParams} : undefined
      return {panes: paneSegments.slice(0, i).concat({id: editDocumentId, params: paneParams})}
    }
  }

  return getFallbackIntentState({documentId: editDocumentId, intentName, params, jsonParams})
}

function getFallbackIntentState({documentId, intentName, params, jsonParams = {}}) {
  const editDocumentId = documentId
  const isTemplateCreate = intentName === 'create' && params.template
  const template = isTemplateCreate && getTemplateById(params.template)

  return isTemplateCreate
    ? {
        editDocumentId,
        type: template.schemaType,
        params: {template: params.template, ...jsonParams}
      }
    : {editDocumentId, type: params.type || '*'}
}

export default {
  router: route('/', [
    // Fallback route if no panes can handle intent
    route('/edit/:type/:editDocumentId', [
      route({path: '/:params', transform: {params: {toState: paramsToState, toPath: paramsToPath}}})
    ]),
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
