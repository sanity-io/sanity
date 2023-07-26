import {RestoreIcon} from '@sanity/icons'
import {getHistoryInspectorName} from '../../getHistoryInspectorName'
import {useDeskTool} from '../../../../useDeskTool'
import {ChangesInspector} from './ChangesInspector'
import {DocumentInspector} from 'sanity'

export function changesInspector(deskConfigName?: string): DocumentInspector {
  return {
    name: getHistoryInspectorName(deskConfigName),
    useMenuItem: () => {
      const {features} = useDeskTool()

      return {
        hidden: !features.reviewChanges,
        icon: RestoreIcon,
        title: 'Review changes',
      }
    },
    component: ChangesInspector,
    onClose: ({params}) => ({params: {...params, since: undefined}}),
    onOpen: ({params}) => ({params: {...params, since: '@lastPublished'}}),
  }
}
