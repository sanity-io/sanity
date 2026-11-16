import {RestoreIcon} from '@sanity/icons/Restore'
import {type DocumentInspector, useTranslation} from 'sanity'

import {createLazyComponent} from '../../../../../core/components/lazy/createLazyComponent'
import {useStructureTool} from '../../../../useStructureTool'
import {HISTORY_INSPECTOR_NAME} from '../../constants'

// The inspector panel renders its component under its own `Suspense` boundary, and the
// implementation is only needed once the inspector is opened, so it stays out of the static import
// graph of `structureTool()`, which every studio config loads up front.
const ChangesTabs = createLazyComponent(() => import('./ChangesTabs.lazy'))

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
