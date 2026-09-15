import {SyncIcon} from '@sanity/icons/Sync'
import {lazy} from 'react'
import {type DocumentInspector, useTranslation} from 'sanity'

import {INCOMING_REFERENCES_INSPECTOR_NAME} from '../../constants'

const IncomingReferencesInspector = lazy(() =>
  import('./IncomingReferencesInspector').then(({IncomingReferencesInspector}) => ({
    default: IncomingReferencesInspector,
  })),
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
