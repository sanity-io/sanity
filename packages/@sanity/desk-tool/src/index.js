import DeskTool from './DeskTool'
import Icon from './Icon'
import {createRoute} from '@sanity/state-router'

export default {
  router: createRoute('/:selectedType/*', [
    createRoute('/:action/:selectedDocumentId'),
  ]),
  name: 'Desk',
  icon: Icon,
  component: DeskTool
}
