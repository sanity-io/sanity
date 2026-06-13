import {SyncIcon} from '@sanity/icons'
import {lazy} from 'react'
import {type DocumentInspector, useTranslation} from 'sanity'

import {INCOMING_REFERENCES_INSPECTOR_NAME} from '../../constants'

// Deferred so the incoming-references inspector UI stays out of the eager structureTool graph; it only renders when the inspector is opened.
const IncomingReferencesInspector = lazy(() =>
  import('./IncomingReferencesInspector').then((module) => ({
    default: module.IncomingReferencesInspector,
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
