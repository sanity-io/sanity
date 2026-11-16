import {VersionsIcon} from '@sanity/icons/Versions'
import {type DocumentInspector, useTranslation} from 'sanity'

import {createLazyComponent} from '../../../../../core/components/lazy/createLazyComponent'
import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../constants'

// The inspector panel renders its component under its own `Suspense` boundary, and the
// implementation is only needed once the inspector is opened, so it stays out of the static import
// graph of `structureTool()`, which every studio config loads up front.
const DocumentGroupInspector = createLazyComponent(() => import('./DocumentGroupInspector.lazy'))

export const documentGroupInspector: DocumentInspector = {
  name: DOCUMENT_GROUP_INSPECTOR_NAME,
  useMenuItem: () => {
    const {t} = useTranslation()

    return {
      icon: VersionsIcon,
      title: t('document-group-inventory.action.manage-versions'),
    }
  },
  component: DocumentGroupInspector,
}
