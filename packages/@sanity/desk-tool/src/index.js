import DeskTool from './DeskTool'
import Icon from './Icon'
import {route} from 'part:@sanity/base/router'

const CAN_HANDLE_INTENTS = ['edit', 'create']

export default {
  router: route('/:selectedType', [
    route('/:action', [
      route('/:selectedDocumentId')
    ])
  ]),
  canHandleIntent(intentName, params) {
    return CAN_HANDLE_INTENTS.includes(intentName) && params.type && params.id
  },
  getIntentState(intentName, params) {
    return {
      selectedType: params.type,
      action: intentName,
      selectedDocumentId: params.id
    }
  },
  title: 'Desk',
  name: 'desk',
  icon: Icon,
  component: DeskTool
}
