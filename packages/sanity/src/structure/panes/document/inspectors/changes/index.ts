import {RestoreIcon} from '@sanity/icons'
import {HISTORY_INSPECTOR_NAME} from '../../constants'
import {useStructureTool} from '../../../../useStructureTool'
import {ChangesInspector} from './ChangesInspector'
import {DocumentInspector, useTranslation} from 'sanity'

export const changesInspector: DocumentInspector = {
  name: HISTORY_INSPECTOR_NAME,
  useMenuItem: () => {
    const {features} = useStructureTool()
    const {t} = useTranslation()

    return {
      hidden: !features.reviewChanges,
      icon: RestoreIcon,
      title: t('changes.title'),
    }
  },
  component: ChangesInspector,
  onClose: ({params}) => ({params: {...params, since: undefined}}),
  onOpen: ({params}) => ({params: {...params, since: '@lastPublished'}}),
}
