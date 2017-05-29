import DeskTool from './DeskTool'
import Icon from 'part:@sanity/base/view-column-icon'
import Uid from '@sanity/uid'
import {route} from 'part:@sanity/base/router'

export default {
  router: route('/:selectedType', [
    route('/:action', [
      route('/:selectedDocumentId')
    ])
  ]),
  canHandleIntent(intentName, params) {
    return (intentName === 'edit' && params.type && params.id)
            || (intentName === 'create' && params.type)
  },
  getIntentState(intentName, params) {
    return {
      selectedType: params.type,
      action: 'edit',
      selectedDocumentId: intentName === 'create' ? Uid() : params.id
    }
  },
  title: 'Desk',
  name: 'desk',
  icon: Icon,
  component: DeskTool
}
