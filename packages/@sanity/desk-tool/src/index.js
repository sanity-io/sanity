import DeskTool from './DeskTool'
import Icon from './Icon'
import {createRoute} from 'router:@sanity/base/router'

export default {
  router: createRoute('/:selectedType/*', [
    createRoute('/:action/:selectedDocumentId'),
  ]),
  name: 'Desk',
  icon: Icon,
  component: DeskTool
}
