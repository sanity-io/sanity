import {SyncIcon} from '@sanity/icons/Sync'
import {type DocumentInspector, useTranslation} from 'sanity'

import {createLazyComponent} from '../../../../../core/components/lazy/createLazyComponent'
import {INCOMING_REFERENCES_INSPECTOR_NAME} from '../../constants'

// The inspector panel renders its component under its own `Suspense` boundary, and the
// implementation is only needed once the inspector is opened, so it stays out of the static import
// graph of `structureTool()`, which every studio config loads up front.
const IncomingReferencesInspector = createLazyComponent(
  () => import('./IncomingReferencesInspector.lazy'),
)

export const incomingReferencesInspector: DocumentInspector = {
  name: INCOMING_REFERENCES_INSPECTOR_NAME,
  useMenuItem: () => {
    const {t} = useTranslation()

    return {
      icon: SyncIcon,
      title: t('incoming-references.title'),
    }
  },
  component: IncomingReferencesInspector,
}
