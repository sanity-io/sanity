import {SyncIcon} from '@sanity/icons/Sync'
import {type DocumentInspector} from 'sanity'
import {useTranslation} from 'sanity/i18n'

import {createLazyComponent} from '../../../../../core/components/lazy/createLazyComponent'
import {INCOMING_REFERENCES_INSPECTOR_NAME} from '../../constants'

const IncomingReferencesInspectorLazy = createLazyComponent(
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
  component: IncomingReferencesInspectorLazy,
}
