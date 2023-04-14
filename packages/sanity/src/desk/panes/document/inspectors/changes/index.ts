import {RestoreIcon} from '@sanity/icons'
import {HISTORY_INSPECTOR_NAME} from '../../constants'
import {ChangesInspector} from './ChangesInspector'
import {DocumentInspector} from 'sanity'

export const changesInspector: DocumentInspector = {
  name: HISTORY_INSPECTOR_NAME,
  useMenuItem: () => ({icon: RestoreIcon, title: 'Review changes'}),
  component: ChangesInspector,
  onClose: ({params}) => ({params: {...params, since: undefined}}),
  onOpen: ({params}) => ({params: {...params, since: '@lastPublished'}}),
}
