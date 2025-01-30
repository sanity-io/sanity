import {RestoreIcon} from '@sanity/icons'
import {type DocumentInspector, useTranslation} from 'sanity'

import {useStructureTool} from '../../../../useStructureTool'
import {HISTORY_INSPECTOR_NAME} from '../../constants'
import {ChangesTabs} from './ChangesTabs'

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
  component: ChangesTabs,
  onClose: ({params}) => ({
    params: {
      ...params,
      since: undefined,
      rev: undefined,
      changesInspectorTab: undefined,
      historyVersion: undefined,
    },
  }),
  onOpen: ({params}) => ({params: {...params, since: '@lastPublished'}}),
}
