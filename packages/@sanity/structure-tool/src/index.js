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

export default {
  router: route('/:panes', {transform: {panes: {toState, toPath}}}),
  canHandleIntent(intentName, params) {
    return (intentName === 'edit' && params.id) || (intentName === 'create' && params.type)
  },
  getIntentState(intentName, params) {
    return {
      selectedType: params.type || '*',
      action: 'edit',
      selectedDocumentId: params.id || UUID()
    }
  },
  title: 'Desk',
  name: 'desk',
  icon: Icon,
  component: DeskTool
}
