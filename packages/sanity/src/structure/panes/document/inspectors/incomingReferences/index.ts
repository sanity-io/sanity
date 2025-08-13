import {SyncIcon} from '@sanity/icons'
import {type DocumentInspector, useTranslation} from 'sanity'

import {INCOMING_REFERENCES_INSPECTOR_NAME} from '../../constants'
import {IncomingReferencesInspector} from './incomingReferencesInspector'

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
