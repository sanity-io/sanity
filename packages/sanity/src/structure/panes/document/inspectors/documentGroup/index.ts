import {DocumentsIcon} from '@sanity/icons/Documents'
import {type DocumentInspector, useTranslation} from 'sanity'

import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../constants'
import {DocumentGroupInspector} from './DocumentGroupInspector'

export const documentGroupInspector: DocumentInspector = {
  name: DOCUMENT_GROUP_INSPECTOR_NAME,
  useMenuItem: () => {
    const {t} = useTranslation()

    // The menu item opens the panel, so it carries the panel's name and the icon of the bottom
    // bar's Manage versions button. "Manage versions" stays the name of that button only.
    return {
      icon: DocumentsIcon,
      title: t('document-group-inventory.panel-title'),
    }
  },
  component: DocumentGroupInspector,
}
