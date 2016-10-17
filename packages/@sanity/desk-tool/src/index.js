import DeskTool from './DeskTool'
import Icon from './Icon'
import {createRoute} from 'part:@sanity/base/router'

export default {
  router: createRoute('/:selectedType/*', [
    createRoute('/:action/*', params => {
      return params.action === 'edit' ? createRoute('/:selectedDocumentId') : null
    }),
  ]),
  name: 'Desk',
  icon: Icon,
  component: DeskTool
}
