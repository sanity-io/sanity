import {JsonIcon} from '@sanity/icons'
import {
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type DocumentInspectorUseMenuItemProps,
  useTranslation,
} from 'sanity'
import {structureLocaleNamespace} from 'sanity/structure'

import {INSPECT_INSPECTOR_NAME} from '../../constants'
import {InspectDialog} from './inspectDialog'

function useMenuItem(props: DocumentInspectorUseMenuItemProps): DocumentInspectorMenuItem {
  const {t} = useTranslation(structureLocaleNamespace)
  return {
    hidden: false,
    icon: JsonIcon,
    title: t('document-inspector.menu-item.title'),
    tone: 'default',
    hotkeys: ['Ctrl', 'Alt', 'I'],
  }
}
export const inspectInspector: DocumentInspector = {
  name: INSPECT_INSPECTOR_NAME,
  component: InspectDialog,
  useMenuItem,
  location: 'portal',
}

// function getInspectItem({hasValue, t}: GetMenuItemsParams): PaneMenuItem {
//   return {
//     action: 'inspect',
//     group: 'inspectors',
//     title: t('document-inspector.menu-item.title'),
//     icon: JsonIcon,
//     isDisabled: !hasValue,
//     shortcut: 'Ctrl+Alt+I',
//   }
// }
