import DeskTool from './DeskTool'
import Icon from './Icon'
import {createRoute} from 'part:@sanity/base/router'

export default {
  router: createRoute('/:selectedType/*', [
    createRoute('/:action/*', [
      createRoute('/:selectedDocumentId')
    ]),
  ]),
  name: 'Desk',
  icon: Icon,
  component: DeskTool
}
