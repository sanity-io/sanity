import {VersionsIcon} from '@sanity/icons/Versions'
import {type DocumentInspector} from 'sanity'
import {useTranslation} from 'sanity/i18n'

import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../constants'
import {DocumentGroupInspector} from './DocumentGroupInspector'

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
