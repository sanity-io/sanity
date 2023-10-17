import {RestoreIcon} from '@sanity/icons'
import {HISTORY_INSPECTOR_NAME} from '../../constants'
import {useDeskTool} from '../../../../useDeskTool'
import {ChangesInspector} from './ChangesInspector'
import {DocumentInspector, useTranslation} from 'sanity'

export const changesInspector: DocumentInspector = {
  name: HISTORY_INSPECTOR_NAME,
  useMenuItem: () => {
    const {features} = useDeskTool()
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
